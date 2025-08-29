(function() {
  'use strict';
  var C, _Hollerith_proto, freeze, ref,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  //===========================================================================================================
  ({freeze} = Object);

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
      defaults: freeze({
        hlr_constructor_cfg: {
          vnr_width: 5/* maximum elements in VNR vector */,
          validate: false,
          // autoextend: false
          format: 'u32'
        }
      })
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL19sZWdhY3ktaW1wbGVtZW50YXRpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxnQkFBQSxFQUFBLE1BQUEsRUFBQSxHQUFBO0lBQUEsb0tBQUE7OztFQUlBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsTUFBNUI7O0VBTU07Ozs7SUFBTixNQUFBLGlCQUFBLENBQUE7O01BeUJpQixPQUFkLFlBQWMsQ0FBRSxRQUFGLENBQUE7QUFDakIsWUFBQTtRQUFJLEtBQUEsR0FBUSxJQUFJLENBQUUsT0FBQSxDQUFRLFdBQVIsQ0FBRixDQUF1QixDQUFDLFNBQTVCLENBQUEsRUFBWjs7UUFFSSxLQUFLLENBQUMsT0FBTixDQUFjLHFCQUFkLEVBQXFDO1VBQUEsS0FBQSxFQUNuQztZQUFBLGVBQUEsRUFBb0MsUUFBQSxDQUFFLENBQUYsQ0FBQTtxQkFBUyxJQUFDLENBQUEsR0FBRyxDQUFDLE1BQUwsQ0FBWSxDQUFaO1lBQVQsQ0FBcEM7WUFDQSwyQkFBQSxFQUFvQyxRQUFBLENBQUUsQ0FBRixDQUFBO3FCQUFTLElBQUMsQ0FBQSxHQUFHLENBQUMsUUFBTCxDQUFjLENBQUMsQ0FBQyxTQUFoQjtZQUFULENBRHBDO1lBRUEseUJBQUEsRUFBb0MsUUFBQSxDQUFFLENBQUYsQ0FBQTtxQkFBUyxJQUFDLENBQUEsR0FBRyxDQUFDLE9BQUwsQ0FBYSxDQUFDLENBQUMsUUFBZjtZQUFULENBRnBDO1lBR0EsK0JBQUEsRUFBb0MsUUFBQSxDQUFFLENBQUYsQ0FBQTtBQUFRLGtCQUFBOzRCQUFDLENBQUMsQ0FBQyxZQUFZLFNBQWQsUUFBcUI7WUFBOUI7VUFIcEM7UUFEbUMsQ0FBckM7UUFLQSxLQUFLLENBQUMsUUFBUSxDQUFDLG1CQUFmLENBQW1DLFFBQVEsQ0FBQyxHQUE1QyxFQVBKOztRQVNJLEtBQUssQ0FBQyxPQUFOLENBQWMsU0FBZCxF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QWhCLENBQXFCLFNBQXJCLEVBREY7O0FBRUEsYUFBTyxDQUFFLEdBQUEsU0FBRixDQUFpQixDQUFDLElBQWxCLENBQXVCLENBQUUsQ0FBRixFQUFLLENBQUwsQ0FBQSxHQUFBO2VBQVksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxDQUFWO01BQVosQ0FBdkI7SUFKRzs7SUFPWixJQUFNLENBQUUsSUFBRixDQUFBO2tDQUNSOztNQUNJLElBQUcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxRQUFSO1FBQ0UsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBaEIsQ0FBcUIsSUFBckIsRUFERjs7QUFFQSxhQUFPLENBQUUsR0FBQSxJQUFGLENBQVksQ0FBQyxJQUFiLENBQWtCLElBQUMsQ0FBQSxHQUFuQjtJQUpIOztFQXJHUixFQWhFQTs7O0VBNktBLENBQUEsR0FBYyxnQkFBZ0IsQ0FBQzs7RUFDL0IsSUFBQyxDQUFBLFNBQUQsR0FBYyxNQUFBLENBQU8sSUFBQyxDQUFBLFNBQVI7O0VBQ2QsSUFBQyxDQUFBLFNBQUQsR0FBYyxJQUFJLElBQUMsQ0FBQSxTQUFMLENBQUE7QUEvS2QiLCJzb3VyY2VzQ29udGVudCI6WyJcblxuJ3VzZSBzdHJpY3QnXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIF9Ib2xsZXJpdGhfcHJvdG9cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBDOiBmcmVlemVcbiAgICB1MzJfc2lnbl9kZWx0YTogICAweDgwMDAwMDAwICAjIyMgdXNlZCB0byBsaWZ0IG5lZ2F0aXZlIG51bWJlcnMgdG8gbm9uLW5lZ2F0aXZlICAgICAgICAgICAgICAgICAgICAgICMjI1xuICAgIHUzMl93aWR0aDogICAgICAgIDQgICAgICAgICAgICMjIyBieXRlcyBwZXIgZWxlbWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyMjXG4gICAgdTMyX25yX21pbjogICAgICAgLTB4ODAwMDAwMDAgIyMjIHNtYWxsZXN0IHBvc3NpYmxlIFZOUiBlbGVtZW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyNcbiAgICB1MzJfbnJfbWF4OiAgICAgICArMHg3ZmZmZmZmZiAjIyMgbGFyZ2VzdCBwb3NzaWJsZSBWTlIgZWxlbWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgYmNkX2RwZTogICAgICAgICAgNCAgICAgICAgICAgIyMjIGRpZ2l0cyBwZXIgZWxlbWVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyNcbiAgICBiY2RfYmFzZTogICAgICAgICAzNiAgICAgICAgICAjIyMgbnVtYmVyIGJhc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMjI1xuICAgIGJjZF9wbHVzOiAgICAgICAgICcrJyAgICAgICAgICMjIyBwbHVzIHN5bWJvbCwgc2hvdWxkIHNvcnQgYWZ0ZXIgYmNkX21pbnVzICAgICAgICAgICAgICAgICAgICAgICAgICAgIyMjXG4gICAgYmNkX21pbnVzOiAgICAgICAgJyEnICAgICAgICAgIyMjIG1pbnVzIHN5bWJvbCwgc2hvdWxkIHNvcnQgYmVmb3JlIGJjZF9wbHVzICAgICAgICAgICAgICAgICAgICAgICAgICAjIyNcbiAgICBiY2RfcGFkZGVyOiAgICAgICAnLicgICAgICAgICAjIyMgdXNlZCB0byBwYWQgZW1wdHkgZmllbGRzICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMjI1xuICAgIGJjZF9ucl9tYXg6ICAgICAgIHBhcnNlSW50ICcrenp6eicsIDM2XG4gICAgYmNkX25yX21pbjogICAgICAgcGFyc2VJbnQgJy16enp6JywgMzZcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGRlZmF1bHRzOiBmcmVlemVcbiAgICAgIGhscl9jb25zdHJ1Y3Rvcl9jZmc6XG4gICAgICAgIHZucl93aWR0aDogICAgNSAgICAgICAgICAgIyMjIG1heGltdW0gZWxlbWVudHMgaW4gVk5SIHZlY3RvciAjIyNcbiAgICAgICAgdmFsaWRhdGU6ICAgICBmYWxzZVxuICAgICAgICAjIGF1dG9leHRlbmQ6IGZhbHNlXG4gICAgICAgIGZvcm1hdDogICAgICAgJ3UzMidcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBjcmVhdGVfdHlwZXM6ICggaW5zdGFuY2UgKSAtPlxuICAgIHR5cGVzID0gbmV3ICggcmVxdWlyZSAnaW50ZXJ0eXBlJyApLkludGVydHlwZSgpXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0eXBlcy5kZWNsYXJlICdobHJfY29uc3RydWN0b3JfY2ZnJywgdGVzdHM6XG4gICAgICBcInggaXMgYSBvYmplY3RcIjogICAgICAgICAgICAgICAgICAgICggeCApIC0+IEBpc2Eub2JqZWN0IHhcbiAgICAgIFwiQGlzYS5jYXJkaW5hbCB4LnZucl93aWR0aFwiOiAgICAgICAgKCB4ICkgLT4gQGlzYS5jYXJkaW5hbCB4LnZucl93aWR0aFxuICAgICAgXCJAaXNhLmJvb2xlYW4geC52YWxpZGF0ZVwiOiAgICAgICAgICAoIHggKSAtPiBAaXNhLmJvb2xlYW4geC52YWxpZGF0ZVxuICAgICAgXCJ4LmZvcm1hdCBpbiBbICd1MzInLCAnYmNkJywgXVwiOiAgICAoIHggKSAtPiB4LmZvcm1hdCBpbiBbICd1MzInLCAnYmNkJywgXVxuICAgIHR5cGVzLnZhbGlkYXRlLmhscl9jb25zdHJ1Y3Rvcl9jZmcgaW5zdGFuY2UuY2ZnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0eXBlcy5kZWNsYXJlICdobHJfdm5yJywgKCB4ICkgLT5cbiAgICAgICMjIyBUQUlOVCBjaGVjayBib3VuZHMgb2YgZWxlbWVudHMgIyMjXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBpc2Eubm9uZW1wdHlfbGlzdCB4XG4gICAgICByZXR1cm4geC5ldmVyeSAoIHh4ICkgPT4gQGlzYS5wb3NpdGl2ZV9pbnRlZ2VyIHh4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gdHlwZXNcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgQGNmZyAgICA9IHsgQGNvbnN0cnVjdG9yLkMuZGVmYXVsdHMuaGxyX2NvbnN0cnVjdG9yX2NmZy4uLiwgY2ZnLi4uLCB9XG4gICAgQHR5cGVzICA9IEBjb25zdHJ1Y3Rvci5jcmVhdGVfdHlwZXMgQFxuICAgIEBjZmcgICAgPSBmcmVlemUgQGNmZ1xuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiNcbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyMjIFRBSU5UIHVzZSBzZXBhcmF0ZSBjbGFzcz8gZm9yIHZhbGlkYXRpb24gdG8gZXNjaGV3IGV4dHJhIGNhbGwgb24gZWFjaCB1c2UgIyMjXG5jbGFzcyBASG9sbGVyaXRoIGV4dGVuZHMgX0hvbGxlcml0aF9wcm90b1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBzdXBlciBjZmdcbiAgICBAZW5jb2RlID0gc3dpdGNoIEBjZmcuZm9ybWF0XG4gICAgICB3aGVuICd1MzInIHRoZW4gQF9lbmNvZGVfdTMyXG4gICAgICB3aGVuICdiY2QnIHRoZW4gQF9lbmNvZGVfYmNkXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2VuY29kZV91MzI6ICggdm5yICkgPT5cbiAgICAjIyMgT2JzZXJ2ZSB0aGF0IHdlIGxpbWl0IGFsbCBWTlIgZWxlbWVudHMgdG8gYFsgdTMyX25yX21heCAuLiB1MzJfbnJfbWluIF1gIHNvIG51bWJlcnMgb3V0c2lkZSB0aGF0XG4gICAgcmFuZ2Ugd2lsbCBubyBsb25nZXIgY2F1c2UgYW4gZXJyb3IuIENsaWVudHMgd2lsbCBoYXZlIHRvIGNoZWNrIGZvciBib3VuZGFyaWVzIHNvbWV3aGVyZSBlbHNlIGlmIHRoZXlcbiAgICBzbyB3aXNoLiAjIyNcbiAgICBAdHlwZXMudmFsaWRhdGUudm5yIHZuciBpZiBAY2ZnLnZhbGlkYXRlXG4gICAgdW5sZXNzIDAgPCB2bnIubGVuZ3RoIDw9IEBjZmcudm5yX3dpZHRoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJeNDQ3OTheIGV4cGVjdGVkIFZOUiB0byBiZSBiZXR3ZWVuIDEgYW5kICN7QGNmZy52bnJfd2lkdGh9IGVsZW1lbnRzIGxvbmcsIGdvdCBsZW5ndGggI3t2bnIubGVuZ3RofVwiXG4gICAgUiAgICAgICA9IEJ1ZmZlci5hbGxvYyBAY2ZnLnZucl93aWR0aCAqIEMudTMyX3dpZHRoLCAweDAwICMjIyBUQUlOVCBwcmUtY29tcHV0ZSBjb25zdGFudCAjIyNcbiAgICBvZmZzZXQgID0gLUMudTMyX3dpZHRoXG4gICAgZm9yIGlkeCBpbiBbIDAgLi4uIEBjZmcudm5yX3dpZHRoIF1cbiAgICAgIG5yID0gdm5yWyBpZHggXSA/IDBcbiAgICAgIG5yID0gTWF0aC5taW4gbnIsIEBjb25zdHJ1Y3Rvci5DLnUzMl9ucl9tYXhcbiAgICAgIG5yID0gTWF0aC5tYXggbnIsIEBjb25zdHJ1Y3Rvci5DLnUzMl9ucl9taW5cbiAgICAgIFIud3JpdGVVSW50MzJCRSBuciArIEMudTMyX3NpZ25fZGVsdGEsICggb2Zmc2V0ICs9IEMudTMyX3dpZHRoIClcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2VuY29kZV9iY2Q6ICggdm5yICkgPT5cbiAgICBAdHlwZXMudmFsaWRhdGUudm5yIHZuciBpZiBAY2ZnLnZhbGlkYXRlXG4gICAgUiA9IFtdXG4gICAgZm9yIGlkeCBpbiBbIDAgLi4uIEBjZmcudm5yX3dpZHRoIF1cbiAgICAgIG5yICAgID0gdm5yWyBpZHggXSA/IDBcbiAgICAgIHNpZ24gID0gaWYgbnIgPj0gMCB0aGVuIEMuYmNkX3BsdXMgZWxzZSBDLmJjZF9taW51c1xuICAgICAgbnIgICAgPSBNYXRoLm1pbiBuciwgQGNvbnN0cnVjdG9yLkMuYmNkX25yX21heFxuICAgICAgbnIgICAgPSBNYXRoLm1heCBuciwgQGNvbnN0cnVjdG9yLkMuYmNkX25yX21pblxuICAgICAgUi5wdXNoIHNpZ24gKyAoICggTWF0aC5hYnMgbnIgKS50b1N0cmluZyBDLmJjZF9iYXNlICkucGFkU3RhcnQgQy5iY2RfZHBlLCBDLmJjZF9wYWRkZXJcbiAgICByZXR1cm4gUi5qb2luICcsJ1xuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAjXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgbmV3X3ZucjogKCBzb3VyY2UgPSBudWxsICkgPT5cbiAgICByZXR1cm4gWyAwLCBdIHVubGVzcyBzb3VyY2U/XG4gICAgQHR5cGVzLnZhbGlkYXRlLnZuciBzb3VyY2UgaWYgQGNmZy52YWxpZGF0ZVxuICAgIHJldHVybiBbIHNvdXJjZS4uLiwgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVlcGVuOiAoIHZuciwgbnIgPSAwICkgPT5cbiAgICAjIyMgR2l2ZW4gYSB2ZWN0b3JpYWwgbGluZSBudW1iZXIgYHZucmAsIHJldHVybiBhIGNvcHkgb2YgYHZucmAsIGNhbGwgaXRcbiAgICBgdm5yMGAsIHdoaWNoIGhhcyBhbiBpbmRleCBvZiBgMGAgYXBwZW5kZWQsIHRodXMgcmVwcmVzZW50aW5nIHRoZSBwcmUtZmlyc3QgYHZucmAgZm9yIGEgbGV2ZWwgb2YgbGluZXNcbiAgICBkZXJpdmVkIGZyb20gdGhlIG9uZSB0aGF0IHRoZSBvcmlnaW5hbCBgdm5yYCBwb2ludGVkIHRvLiAjIyNcbiAgICBAdHlwZXMudmFsaWRhdGUudm5yIHZuciBpZiBAY2ZnLnZhbGlkYXRlXG4gICAgcmV0dXJuIFsgdm5yLi4uLCBuciwgXVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWR2YW5jZTogICggdm5yICkgPT4gQG1vdmUgdm5yLCArMVxuICByZWNlZGU6ICAgKCB2bnIgKSA9PiBAbW92ZSB2bnIsIC0xXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBtb3ZlOiAoIHZuciwgZGVsdGEgKSA9PlxuICAgICMjIyBHaXZlbiBhIHZlY3RvcmlhbCBsaW5lIG51bWJlciBgdm5yYCwgcmV0dXJuIGEgY29weSBvZiBgdm5yYCwgY2FsbCBpdFxuICAgIGB2bnIwYCwgd2hpY2ggaGFzIGl0cyBsYXN0IGluZGV4IGluY3JlbWVudGVkIGJ5IGAxYCwgdGh1cyByZXByZXNlbnRpbmcgdGhlIHZlY3RvcmlhbCBsaW5lIG51bWJlciBvZiB0aGVcbiAgICBuZXh0IGxpbmUgaW4gdGhlIHNhbWUgbGV2ZWwgdGhhdCBpcyBkZXJpdmVkIGZyb20gdGhlIHNhbWUgbGluZSBhcyBpdHMgcHJlZGVjZXNzb3IuICMjI1xuICAgIGlmIEBjZmcudmFsaWRhdGVcbiAgICAgIEB0eXBlcy52YWxpZGF0ZS52bnIgdm5yXG4gICAgICBAdHlwZXMudmFsaWRhdGUuaW50ZWdlciBkZWx0YVxuICAgIFIgICAgICAgICAgICAgICAgICAgPSBbIHZuci4uLiwgXVxuICAgIFJbIHZuci5sZW5ndGggLSAxIF0gICs9IGRlbHRhXG4gICAgcmV0dXJuIFJcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgIyBTT1JUSU5HXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY21wX2Jsb2JzOiAoIGEsIGIgKSA9PiBhLmNvbXBhcmUgYlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY21wOiAoIGEsIGIgKSA9PlxuICAgIGlmIEBjZmcudmFsaWRhdGVcbiAgICAgIEB0eXBlcy52YWxpZGF0ZS52bnIgYVxuICAgICAgQHR5cGVzLnZhbGlkYXRlLnZuciBiXG4gICAgZm9yIGlkeCBpbiBbIDAgLi4uICggTWF0aC5tYXggYS5sZW5ndGgsIGIubGVuZ3RoICkgXVxuICAgICAgYWkgPSBhWyBpZHggXSA/IDBcbiAgICAgIGJpID0gYlsgaWR4IF0gPyAwXG4gICAgICByZXR1cm4gLTEgaWYgYWkgPCBiaVxuICAgICAgcmV0dXJuICsxIGlmIGFpID4gYmlcbiAgICByZXR1cm4gMFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc29ydF9ibG9iczogKCB2bnJfYmxvYnMgKSA9PlxuICAgICMjIyBHaXZlbiBhIGxpc3Qgb2YgVk5ScywgcmV0dXJuIGEgY29weSBvZiB0aGUgbGlzdCB3aXRoIHRoZSBWTlJzIGxleGljb2dyYXBoaWNhbGx5IHNvcnRlZC4gIyMjXG4gICAgaWYgQGNmZy52YWxpZGF0ZVxuICAgICAgQHR5cGVzLnZhbGlkYXRlLmxpc3Qgdm5yX2Jsb2JzXG4gICAgcmV0dXJuIFsgdm5yX2Jsb2JzLi4uLCBdLnNvcnQgKCBhLCBiICkgPT4gYS5jb21wYXJlIGJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHNvcnQ6ICggdm5ycyApID0+XG4gICAgIyMjIEdpdmVuIGEgbGlzdCBvZiBWTlJzLCByZXR1cm4gYSBjb3B5IG9mIHRoZSBsaXN0IHdpdGggdGhlIFZOUnMgbGV4aWNvZ3JhcGhpY2FsbHkgc29ydGVkLiAjIyNcbiAgICBpZiBAY2ZnLnZhbGlkYXRlXG4gICAgICBAdHlwZXMudmFsaWRhdGUubGlzdCB2bnJzXG4gICAgcmV0dXJuIFsgdm5ycy4uLiwgXS5zb3J0IEBjbXBcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkMgICAgICAgICAgID0gX0hvbGxlcml0aF9wcm90by5DXG5ASG9sbGVyaXRoICA9IGZyZWV6ZSBASG9sbGVyaXRoXG5ASE9MTEVSSVRIICA9IG5ldyBASG9sbGVyaXRoKClcblxuXG4iXX0=
