(function() {
  'use strict';
  var C, CND, assign, badge, create_types, debug, echo, freeze, help, info, jr, lets, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'HOLLERITH';

  debug = CND.get_logger('debug', badge);

  warn = CND.get_logger('warn', badge);

  info = CND.get_logger('info', badge);

  urge = CND.get_logger('urge', badge);

  help = CND.get_logger('help', badge);

  whisper = CND.get_logger('whisper', badge);

  echo = CND.echo.bind(CND);

  ({jr, assign} = CND);

  ({lets, freeze} = require('letsfreezethat'));

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  C = freeze({
    sign_delta: 0x80000000/* used to lift negative numbers to non-negative */,
    u32_width: 4/* bytes per element */,
    nr_min: -0x80000000/* smallest possible VNR element */,
    nr_max: +0x7fffffff/* largest possible VNR element */,
    //.........................................................................................................
    defaults: {
      hlr_constructor_cfg: {
        vnr_width: 5/* maximum elements in VNR vector */,
        validate: false
      }
    }
  });

  // autoextend: false

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  create_types = function(instance) {
    var types;
    types = new (require('intertype')).Intertype();
    //-----------------------------------------------------------------------------------------------------------
    types.declare('hlr_constructor_cfg', {
      tests: {
        "x is a object": function(x) {
          return this.isa.object(x);
        },
        "@isa.cardinal x.vnr_width": function(x) {
          return this.isa.cardinal(x.vnr_width);
        },
        "@isa.boolean x.validate": function(x) {
          return this.isa.boolean(x.validate);
        }
      }
    });
    types.validate.hlr_constructor_cfg(instance.cfg);
    //-----------------------------------------------------------------------------------------------------------
    types.declare('hlr_vnr', function(x) {
      if (!this.isa.nonempty_list(x)) {
        /* TAINT check bounds of elements */
        return false;
      }
      return x.every((xx) => {
        return this.isa.positive_integer(xx);
      });
    });
    //-----------------------------------------------------------------------------------------------------------
    return types;
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT use separate class? for validation to eschew extra call on each use */
  this.Hollerith = (function() {
    class Hollerith {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        //=========================================================================================================

        //---------------------------------------------------------------------------------------------------------
        this.create = this.create.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.deepen = this.deepen.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.advance = this.advance.bind(this);
        this.recede = this.recede.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.move = this.move.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._first_nonzero_is_negative = this._first_nonzero_is_negative.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.cmp = this.cmp.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this.sort = this.sort.bind(this);
        this.cfg = {...C.defaults.hlr_constructor_cfg, ...cfg};
        this.types = create_types(this);
        this.cfg = freeze(this.cfg);
        return void 0;
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      encode(vnr) {
        var R, i, idx, offset/* TAINT pre-compute constant */, ref, ref1, ref2;
        if (this.cfg.validate) {
          this.types.validate.vnr(vnr);
        }
        if (!((0 < (ref = vnr.length) && ref <= this.cfg.vnr_width))) {
          throw new Error(`^44798^ expected VNR to be between 1 and ${this.cfg.vnr_width} elements long, got length ${vnr.length}`);
        }
        R = Buffer.alloc(this.cfg.vnr_width * C.u32_width, 0x00);
        offset = -C.u32_width;
        for (idx = i = 0, ref1 = this.cfg.vnr_width; (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
          R.writeUInt32BE(((ref2 = vnr[idx]) != null ? ref2 : 0) + C.sign_delta, (offset += C.u32_width));
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _encode_bcd(vnr) {
        var R, base, dpe, i, idx, minus, nr, padder, plus, ref, ref1, sign;
        dpe = 4/* digits per element */
        base = 36;
        plus = '+';
        minus = '!';
        padder = '.';
        R = [];
        for (idx = i = 0, ref = this.cfg.vnr_width; (0 <= ref ? i < ref : i > ref); idx = 0 <= ref ? ++i : --i) {
          nr = (ref1 = vnr[idx]) != null ? ref1 : 0;
          sign = nr >= 0 ? plus : minus;
          R.push(sign + ((Math.abs(nr)).toString(base)).padStart(dpe, padder));
        }
        return R.join(',');
      }

      create(source = null) {
        if (source == null) {
          return [0];
        }
        if (this.cfg.validate) {
          this.types.validate.vnr(source);
        }
        return [...source];
      }

      deepen(vnr, nr = 0) {
        if (this.cfg.validate) {
          /* Given a vectorial line number `vnr`, return a copy of `vnr`, call it
             `vnr0`, which has an index of `0` appended, thus representing the pre-first `vnr` for a level of lines
             derived from the one that the original `vnr` pointed to. */
          this.types.validate.vnr(vnr);
        }
        return [...vnr, nr];
      }

      advance(vnr) {
        return this.move(vnr, +1);
      }

      recede(vnr) {
        return this.move(vnr, -1);
      }

      move(vnr, delta) {
        var R;
        /* Given a vectorial line number `vnr`, return a copy of `vnr`, call it
           `vnr0`, which has its last index incremented by `1`, thus representing the vectorial line number of the
           next line in the same level that is derived from the same line as its predecessor. */
        if (this.cfg.validate) {
          this.types.validate.vnr(vnr);
          this.types.validate.integer(delta);
        }
        R = [...vnr];
        R[vnr.length - 1] += delta;
        return R;
      }

      _first_nonzero_is_negative(list, first_idx) {
        var R, idx;
        idx = first_idx;
        while (true) {
          if ((R = list[idx]) === 0) {
            idx++;
            continue;
          }
          if ((R === void 0) || (R > 0)) {
            return false;
          }
          return true;
        }
      }

      cmp(a, b) {
        var a_length, ai, b_length, bi, i, idx, min_idx, ref;
        if (this.cfg.validate) {
          this.types.validate.vnr(a);
          this.types.validate.vnr(b);
        }
        a_length = a.length;
        b_length = b.length;
        min_idx = (Math.min(a_length, b_length)) - 1;
        for (idx = i = 0, ref = min_idx; (0 <= ref ? i <= ref : i >= ref); idx = 0 <= ref ? ++i : --i) {
          ai = a[idx];
          bi = b[idx];
          if (ai < bi) {
            return -1;
          }
          if (ai > bi) {
            return +1;
          }
        }
        if (a_length === b_length) {
          return 0;
        }
        if (a_length < b_length) {
          if (this._first_nonzero_is_negative(b, min_idx + 1)) {
            return +1;
          }
          return -1;
        }
        if (this._first_nonzero_is_negative(a, min_idx + 1)) {
          return -1;
        }
        return +1;
      }

      sort(vnrs) {
        /* Given a list of VNRs, return a copy of the list with the VNRs lexicographically sorted. */
        if (this.cfg.validate) {
          this.types.validate.list(vnrs);
        }
        return [...vnrs].sort(this.cmp);
      }

    };

    //---------------------------------------------------------------------------------------------------------
    Hollerith.C = C;

    return Hollerith;

  }).call(this);

  //===========================================================================================================
  this.Hollerith = freeze(this.Hollerith);

  this.HOLLERITH = new this.Hollerith();

}).call(this);

//# sourceMappingURL=main.js.map