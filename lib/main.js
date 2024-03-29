(function() {
  'use strict';
  var C, CND, _Hollerith_proto, assign, badge, debug, echo, freeze, help, info, jr, lets, ref, rpr, urge, warn, whisper,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

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

  _Hollerith_proto = (function() {
    //===========================================================================================================

    //-----------------------------------------------------------------------------------------------------------
    class _Hollerith_proto {
      //---------------------------------------------------------------------------------------------------------
      static create_types(instance) {
        var types;
        types = new (require('intertype')).Intertype();
        //.......................................................................................................
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
            },
            "x.format in [ 'u32', 'bcd', ]": function(x) {
              var ref;
              return (ref = x.format) === 'u32' || ref === 'bcd';
            }
          }
        });
        types.validate.hlr_constructor_cfg(instance.cfg);
        //.......................................................................................................
        types.declare('hlr_vnr', function(x) {
          if (!this.isa.nonempty_list(x)) {
            /* TAINT check bounds of elements */
            return false;
          }
          return x.every((xx) => {
            return this.isa.positive_integer(xx);
          });
        });
        //.......................................................................................................
        return types;
      }

      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        this.cfg = {...this.constructor.C.defaults.hlr_constructor_cfg, ...cfg};
        this.types = this.constructor.create_types(this);
        this.cfg = freeze(this.cfg);
        return void 0;
      }

    };

    //---------------------------------------------------------------------------------------------------------
    _Hollerith_proto.C = freeze({
      u32_sign_delta: 0x80000000/* used to lift negative numbers to non-negative                      */,
      u32_width: 4/* bytes per element                                                  */,
      u32_nr_min: -0x80000000/* smallest possible VNR element                                      */,
      u32_nr_max: +0x7fffffff/* largest possible VNR element                                       */,
      //.......................................................................................................
      bcd_dpe: 4/* digits per element                                                 */,
      bcd_base: 36/* number base                                                        */,
      bcd_plus: '+'/* plus symbol, should sort after bcd_minus                           */,
      bcd_minus: '!'/* minus symbol, should sort before bcd_plus                          */,
      bcd_padder: '.'/* used to pad empty fields                                           */,
      bcd_nr_max: parseInt('+zzzz', 36),
      bcd_nr_min: parseInt('-zzzz', 36),
      //.......................................................................................................
      defaults: {
        hlr_constructor_cfg: {
          vnr_width: 5/* maximum elements in VNR vector */,
          validate: false,
          // autoextend: false
          format: 'u32'
        }
      }
    });

    return _Hollerith_proto;

  }).call(this);

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT use separate class? for validation to eschew extra call on each use */
  ref = this.Hollerith = class Hollerith extends _Hollerith_proto {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      super(cfg);
      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      this._encode_u32 = this._encode_u32.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this._encode_bcd = this._encode_bcd.bind(this);
      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      this.new_vnr = this.new_vnr.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.deepen = this.deepen.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.advance = this.advance.bind(this);
      this.recede = this.recede.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.move = this.move.bind(this);
      //=========================================================================================================
      // SORTING
      //---------------------------------------------------------------------------------------------------------
      this.cmp_blobs = this.cmp_blobs.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.cmp = this.cmp.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.sort_blobs = this.sort_blobs.bind(this);
      //---------------------------------------------------------------------------------------------------------
      this.sort = this.sort.bind(this);
      this.encode = (function() {
        switch (this.cfg.format) {
          case 'u32':
            return this._encode_u32;
          case 'bcd':
            return this._encode_bcd;
        }
      }).call(this);
      return void 0;
    }

    _encode_u32(vnr) {
      var R, i, idx, nr, offset/* TAINT pre-compute constant */, ref1, ref2, ref3;
      boundMethodCheck(this, ref);
      if (this.cfg.validate) {
        /* Observe that we limit all VNR elements to `[ u32_nr_max .. u32_nr_min ]` so numbers outside that
           range will no longer cause an error. Clients will have to check for boundaries somewhere else if they
           so wish. */
        this.types.validate.vnr(vnr);
      }
      if (!((0 < (ref1 = vnr.length) && ref1 <= this.cfg.vnr_width))) {
        throw new Error(`^44798^ expected VNR to be between 1 and ${this.cfg.vnr_width} elements long, got length ${vnr.length}`);
      }
      R = Buffer.alloc(this.cfg.vnr_width * C.u32_width, 0x00);
      offset = -C.u32_width;
      for (idx = i = 0, ref2 = this.cfg.vnr_width; (0 <= ref2 ? i < ref2 : i > ref2); idx = 0 <= ref2 ? ++i : --i) {
        nr = (ref3 = vnr[idx]) != null ? ref3 : 0;
        nr = Math.min(nr, this.constructor.C.u32_nr_max);
        nr = Math.max(nr, this.constructor.C.u32_nr_min);
        R.writeUInt32BE(nr + C.u32_sign_delta, (offset += C.u32_width));
      }
      return R;
    }

    _encode_bcd(vnr) {
      var R, i, idx, nr, ref1, ref2, sign;
      boundMethodCheck(this, ref);
      if (this.cfg.validate) {
        this.types.validate.vnr(vnr);
      }
      R = [];
      for (idx = i = 0, ref1 = this.cfg.vnr_width; (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
        nr = (ref2 = vnr[idx]) != null ? ref2 : 0;
        sign = nr >= 0 ? C.bcd_plus : C.bcd_minus;
        nr = Math.min(nr, this.constructor.C.bcd_nr_max);
        nr = Math.max(nr, this.constructor.C.bcd_nr_min);
        R.push(sign + ((Math.abs(nr)).toString(C.bcd_base)).padStart(C.bcd_dpe, C.bcd_padder));
      }
      return R.join(',');
    }

    new_vnr(source = null) {
      boundMethodCheck(this, ref);
      if (source == null) {
        return [0];
      }
      if (this.cfg.validate) {
        this.types.validate.vnr(source);
      }
      return [...source];
    }

    deepen(vnr, nr = 0) {
      boundMethodCheck(this, ref);
      if (this.cfg.validate) {
        /* Given a vectorial line number `vnr`, return a copy of `vnr`, call it
           `vnr0`, which has an index of `0` appended, thus representing the pre-first `vnr` for a level of lines
           derived from the one that the original `vnr` pointed to. */
        this.types.validate.vnr(vnr);
      }
      return [...vnr, nr];
    }

    advance(vnr) {
      boundMethodCheck(this, ref);
      return this.move(vnr, +1);
    }

    recede(vnr) {
      boundMethodCheck(this, ref);
      return this.move(vnr, -1);
    }

    move(vnr, delta) {
      var R;
      boundMethodCheck(this, ref);
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

    cmp_blobs(a, b) {
      boundMethodCheck(this, ref);
      return a.compare(b);
    }

    cmp(a, b) {
      var ai, bi, i, idx, ref1, ref2, ref3;
      boundMethodCheck(this, ref);
      if (this.cfg.validate) {
        this.types.validate.vnr(a);
        this.types.validate.vnr(b);
      }
      for (idx = i = 0, ref1 = Math.max(a.length, b.length); (0 <= ref1 ? i < ref1 : i > ref1); idx = 0 <= ref1 ? ++i : --i) {
        ai = (ref2 = a[idx]) != null ? ref2 : 0;
        bi = (ref3 = b[idx]) != null ? ref3 : 0;
        if (ai < bi) {
          return -1;
        }
        if (ai > bi) {
          return +1;
        }
      }
      return 0;
    }

    sort_blobs(vnr_blobs) {
      boundMethodCheck(this, ref);
      /* Given a list of VNRs, return a copy of the list with the VNRs lexicographically sorted. */
      if (this.cfg.validate) {
        this.types.validate.list(vnr_blobs);
      }
      return [...vnr_blobs].sort((a, b) => {
        return a.compare(b);
      });
    }

    sort(vnrs) {
      boundMethodCheck(this, ref);
      /* Given a list of VNRs, return a copy of the list with the VNRs lexicographically sorted. */
      if (this.cfg.validate) {
        this.types.validate.list(vnrs);
      }
      return [...vnrs].sort(this.cmp);
    }

  };

  //===========================================================================================================
  C = _Hollerith_proto.C;

  this.Hollerith = freeze(this.Hollerith);

  this.HOLLERITH = new this.Hollerith();

}).call(this);

//# sourceMappingURL=main.js.map