(function() {
  'use strict';
  var Hollerith_typespace, SFMODULES, Type, Typespace, _test_monotony, clean_assign, debug, hide, nameit, omit, regex, remap, rpr, set_getter, type_of;

  //===========================================================================================================
  SFMODULES = require('bricabrac-single-file-modules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({debug} = console);

  ({regex} = require('regex'));

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

  ({nameit} = SFMODULES.require_nameit());

  ({clean_assign} = SFMODULES.unstable.require_clean_assign());

  ({remap, omit} = SFMODULES.unstable.require_remap());

  // #===========================================================================================================
  // ### NOTE Future Single-File Module ###
  // class Bounded_list

    //   #---------------------------------------------------------------------------------------------------------
  //   constructor: ( max_size = 3 ) ->
  //     @max_size   = max_size
  //     @data       = []
  //     return undefined

    //   #---------------------------------------------------------------------------------------------------------
  //   create: ( P... ) ->
  //     @data.push clean_assign {}, P...
  //     @data.shift() if @size > @max_size
  //     return @current

    //   #---------------------------------------------------------------------------------------------------------
  //   assign: ( P...  ) -> clean_assign @current, P...
  //   at:     ( idx   ) -> @data.at idx

    //   #---------------------------------------------------------------------------------------------------------
  //   set_getter @::, 'size',     -> @data.length
  //   set_getter @::, 'is_empty', -> @data.length is 0
  //   set_getter @::, 'current',  -> if @is_empty then @create() else @at -1

    //===========================================================================================================
  /* NOTE Future Single-File Module */
  Type = class Type {
    //---------------------------------------------------------------------------------------------------------
    constructor(typespace, name, isa) {
      hide(this, 'name', name);
      hide(this, 'T', typespace);
      hide(this, '_isa', isa);
      this.data = {}; // new Bounded_list()
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    isa(x) {
      var R;
      // try
      //   ( new Test guytest_cfg ).test { types: @hollerith.types, }
      // finally
      //   debug 'Ωhllt___1', "error"
      this.data = {};
      R = this._isa.call(this, x);
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    isame(caller, mapping, x) {
      var R, arity, original_data;
      // try
      //   ( new Test guytest_cfg ).test { types: @hollerith.types, }
      // finally
      //   debug 'Ωhllt___2', "error"
      switch (arity = arguments.length) {
        case 2:
          [caller, mapping, x] = [caller, null, mapping];
          R = this._isa.call(caller, x);
          break;
        case 3:
          original_data = caller.data;
          caller.data = Object.assign({}, caller.data);
          R = this._isa.call(caller, x);
          caller.data = Object.assign(original_data, remap(caller.data, mapping));
          break;
        default:
          throw new Error(`Ωbsk___3 expected 2 or 3 arguments, got ${arity}`);
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    isa2(x, data = null, mapping = null) {
      var R;
      // try
      //.......................................................................................................
      if (data != null) {
        //.....................................................................................................
        if (mapping != null) {
          this./* d1 m1 */data = {};
          R = this._isa.call(this, x);
          clean_assign(data, remap(clean_assign({}, this.data), mapping));
          return R;
        } else {
          //.....................................................................................................
          this./* d1 m0 */data = {};
          R = this._isa.call(this, x);
          clean_assign(data, this.data);
          return R;
        }
      //.......................................................................................................
      } else if (mapping != null) {
        this./* d0 m1 */data = {};
        R = this._isa.call(this, x);
        remap(this.data, mapping);
        return R;
      }
      //.......................................................................................................
      this.data = {};
      return this./* d0 m0 */_isa.call(this, x);
    }

    // finally

      //---------------------------------------------------------------------------------------------------------
    assign(...P) {
      return clean_assign(this.data, ...P);
    }

    //---------------------------------------------------------------------------------------------------------
    fail(message, ...P) {
      clean_assign(this.data, {message}, ...P);
      return false;
    }

  };

  //===========================================================================================================
  Typespace = class Typespace {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      var Typeclass, clasz, i, isa, len, name, ref;
      clasz = this.constructor;
      ref = Object.getOwnPropertyNames(clasz);
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        Typeclass = class Typeclass extends Type {};
        nameit(name, Typeclass);
        this[name] = new Typeclass(this, name, isa = clasz[name]);
      }
      return void 0;
    }

  };

  //###########################################################################################################
  // HOLLERITH TYPESPACE
  //===========================================================================================================
  Hollerith_typespace = class Hollerith_typespace extends Typespace {
    //=========================================================================================================
    static text(x) {
      return (type_of(x)) === 'text';
    }

    static nonempty_text(x) {
      return (this.T.text.isa(x)) && x.length > 0;
    }

    static float(x) {
      return Number.isFinite(x);
    }

    static integer(x) {
      return Number.isSafeInteger(x);
    }

    static pinteger(x) {
      return (this.T.integer.isa(x)) && x > 0;
    }

    static zpinteger(x) {
      return (this.T.integer.isa(x)) && x >= 0;
    }

    static cardinal(x) {
      return this.T.zpinteger.isa(x);
    }

    //---------------------------------------------------------------------------------------------------------
    static dimension(x) {
      return this.T.pinteger.isa(x);
    }

    //---------------------------------------------------------------------------------------------------------
    static incremental_text(x) {
      if (!this.T.text.isa(x)) {
        return false;
      }
      // @assign { iam: 'incremental_text', }
      this.assign({
        chrs: Array.from(x)
      });
      debug('Ωbsk___5', this.data);
      return _test_monotony.call(this, x, '<');
    }

    //---------------------------------------------------------------------------------------------------------
    static decremental_text(x) {
      if (!this.T.text.isa(x)) {
        return false;
      }
      this.assign({
        chrs: Array.from(x)
      });
      return _test_monotony.call(this, x, '>');
    }

    //---------------------------------------------------------------------------------------------------------
    static nmag_bare_reversed(x) {
      return this.T.incremental_text.isame(this, x);
    }

    static pmag_bare(x) {
      return this.T.incremental_text.isame(this, x);
    }

    //---------------------------------------------------------------------------------------------------------
    static magnifiers(x) {
      var nmag, nmag_bare_reversed, pmag, pmag_bare;
      if (!this.T.nonempty_text.isa(x)) {
        return this.fail("expected a magnifier, got an empty text");
      }
      [nmag_bare_reversed, pmag_bare] = x.split(/\s+/v);
      if (!this.T.nmag_bare_reversed.isame(this, {
        chrs: 'nmag_chrs'
      }, nmag_bare_reversed)) {
        //.......................................................................................................
        // @assign { iam: 'magnifiers', }; debug 'Ωbsk___6', @data
        return this.fail("???");
      }
      if (!this.T.pmag_bare.isame(this, {
        chrs: 'pmag_chrs'
      }, pmag_bare)) {
        return this.fail("???");
      }
      //.......................................................................................................
      nmag = ' ' + nmag_bare_reversed.reverse();
      pmag = ' ' + pmag_bare;
      this.assign({nmag, pmag});
      return true;
    }

  };

  //===========================================================================================================
  _test_monotony = function(x, cmp) {
    var R, chr, chrs, i, idx, prv_chr, ref;
    ({chrs} = this.data); // = @create data
    if (chrs.length === 0) {
      return this.fail("empty is not monotonic");
    }
    if (chrs.length === 1) {
      return true;
    }
    for (idx = i = 1, ref = chrs.length; (1 <= ref ? i < ref : i > ref); idx = 1 <= ref ? ++i : --i) {
      prv_chr = chrs[idx - 1];
      chr = chrs[idx];
      R = (function() {
        switch (cmp) {
          case '>':
            return prv_chr > chr;
          case '<':
            return prv_chr < chr;
          default:
            throw new Error(`Ωbsk___7 (internal) expected '>' or '<', got ${rpr(cmp)}`);
        }
      })();
      if (R) {
        continue;
      }
      this.assign({
        fail: {x, idx, prv_chr, chr}
      });
      return false;
    }
    return true;
  };

  //===========================================================================================================
  Object.assign(module.exports, {
    types: new Hollerith_typespace(),
    internals: {Type, Typespace, Hollerith_typespace}
  });

  // Bounded_list

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxtQkFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBOzs7RUFHQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCOztFQUVBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLGNBQVYsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFuQixDQUFBLENBRDVCLEVBWkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBNENNLE9BQU4sTUFBQSxLQUFBLENBQUE7O0lBR0UsV0FBYSxDQUFFLFNBQUYsRUFBYSxJ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T0FBVixFQUFtQixHQUFuQjtNQUFSLENBQVI7QUFDQSxhQUFPO0lBVFQ7QUFVQSxXQUFPO0VBZFEsRUF0TGpCOzs7RUF1TUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFDRTtJQUFBLEtBQUEsRUFBWSxJQUFJLG1CQUFKLENBQUEsQ0FBWjtJQUNBLFNBQUEsRUFBVyxDQUNULElBRFMsRUFFVCxTQUZTLEVBR1QsbUJBSFM7RUFEWCxDQURGOztFQXZNQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgcmVtYXAsXG4gIG9taXQsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfcmVtYXAoKVxuXG5cbiMgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4jIGNsYXNzIEJvdW5kZWRfbGlzdFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIGNvbnN0cnVjdG9yOiAoIG1heF9zaXplID0gMyApIC0+XG4jICAgICBAbWF4X3NpemUgICA9IG1heF9zaXplXG4jICAgICBAZGF0YSAgICAgICA9IFtdXG4jICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiMgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jICAgY3JlYXRlOiAoIFAuLi4gKSAtPlxuIyAgICAgQGRhdGEucHVzaCBjbGVhbl9hc3NpZ24ge30sIFAuLi5cbiMgICAgIEBkYXRhLnNoaWZ0KCkgaWYgQHNpemUgPiBAbWF4X3NpemVcbiMgICAgIHJldHVybiBAY3VycmVudFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIGFzc2lnbjogKCBQLi4uICApIC0+IGNsZWFuX2Fzc2lnbiBAY3VycmVudCwgUC4uLlxuIyAgIGF0OiAgICAgKCBpZHggICApIC0+IEBkYXRhLmF0IGlkeFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsICAgICAtPiBAZGF0YS5sZW5ndGhcbiMgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQGRhdGEubGVuZ3RoIGlzIDBcbiMgICBzZXRfZ2V0dGVyIEA6OiwgJ2N1cnJlbnQnLCAgLT4gaWYgQGlzX2VtcHR5IHRoZW4gQGNyZWF0ZSgpIGVsc2UgQGF0IC0xXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuY2xhc3MgVHlwZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggdHlwZXNwYWNlLCBuYW1lLCBpc2EgKSAtPlxuICAgIGhpZGUgQCwgJ25hbWUnLCAgIG5hbWVcbiAgICBoaWRlIEAsICdUJywgICAgICB0eXBlc3BhY2VcbiAgICBoaWRlIEAsICdfaXNhJywgICBpc2FcbiAgICBAZGF0YSAgICAgICAgICAgPSB7fSAjIG5ldyBCb3VuZGVkX2xpc3QoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYTogKCB4ICkgLT5cbiAgICAjIHRyeVxuICAgICMgICAoIG5ldyBUZXN0IGd1eXRlc3RfY2ZnICkudGVzdCB7IHR5cGVzOiBAaG9sbGVyaXRoLnR5cGVzLCB9XG4gICAgIyBmaW5hbGx5XG4gICAgIyAgIGRlYnVnICfOqWhsbHRfX18xJywgXCJlcnJvclwiXG4gICAgQGRhdGEgPSB7fTsgUiA9IEBfaXNhLmNhbGwgQCwgeFxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2FtZTogKCBjYWxsZXIsIG1hcHBpbmcsIHggKSAtPlxuICAgICMgdHJ5XG4gICAgIyAgICggbmV3IFRlc3QgZ3V5dGVzdF9jZmcgKS50ZXN0IHsgdHlwZXM6IEBob2xsZXJpdGgudHlwZXMsIH1cbiAgICAjIGZpbmFsbHlcbiAgICAjICAgZGVidWcgJ86paGxsdF9fXzInLCBcImVycm9yXCJcbiAgICBzd2l0Y2ggYXJpdHkgPSBhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aGVuIDJcbiAgICAgICAgWyBjYWxsZXIsIG1hcHBpbmcsIHgsIF0gPSBbIGNhbGxlciwgbnVsbCwgbWFwcGluZywgXVxuICAgICAgICBSICAgICAgICAgICAgICAgICAgICAgICA9IEBfaXNhLmNhbGwgY2FsbGVyLCB4XG4gICAgICB3aGVuIDNcbiAgICAgICAgb3JpZ2luYWxfZGF0YSAgICAgICAgICAgPSBjYWxsZXIuZGF0YVxuICAgICAgICBjYWxsZXIuZGF0YSAgICAgICAgICAgICA9IE9iamVjdC5hc3NpZ24ge30sIGNhbGxlci5kYXRhXG4gICAgICAgIFIgICAgICAgICAgICAgICAgICAgICAgID0gQF9pc2EuY2FsbCBjYWxsZXIsIHhcbiAgICAgICAgY2FsbGVyLmRhdGEgICAgICAgICAgICAgPSBPYmplY3QuYXNzaWduIG9yaWdpbmFsX2RhdGEsICggcmVtYXAgY2FsbGVyLmRhdGEsIG1hcHBpbmcgKVxuICAgICAgZWxzZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWJza19fXzMgZXhwZWN0ZWQgMiBvciAzIGFyZ3VtZW50cywgZ290ICN7YXJpdHl9XCJcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhMjogKCB4LCBkYXRhID0gbnVsbCwgbWFwcGluZyA9IG51bGwgKSAtPlxuICAgICMgdHJ5XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBkYXRhP1xuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBpZiBtYXBwaW5nPyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyMjIGQxIG0xICMjI1xuICAgICAgICBAZGF0YSAgID0ge31cbiAgICAgICAgUiAgICAgICA9IEBfaXNhLmNhbGwgQCwgeFxuICAgICAgICBjbGVhbl9hc3NpZ24gZGF0YSwgKCByZW1hcCAoIGNsZWFuX2Fzc2lnbiB7fSwgQGRhdGEgKSwgbWFwcGluZyApXG4gICAgICAgIHJldHVybiBSXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyMgZDEgbTAgIyMjXG4gICAgICAgIEBkYXRhID0ge31cbiAgICAgICAgUiAgICAgPSBAX2lzYS5jYWxsIEAsIHhcbiAgICAgICAgY2xlYW5fYXNzaWduIGRhdGEsIEBkYXRhXG4gICAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBlbHNlIGlmIG1hcHBpbmc/ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyMgZDAgbTEgIyMjXG4gICAgICBAZGF0YSA9IHt9XG4gICAgICBSICAgICA9IEBfaXNhLmNhbGwgQCwgeFxuICAgICAgcmVtYXAgQGRhdGEsIG1hcHBpbmdcbiAgICAgIHJldHVybiBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAZGF0YSA9IHt9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyMgZDAgbTAgIyMjXG4gICAgcmV0dXJuIEBfaXNhLmNhbGwgQCwgeFxuICAgICMgZmluYWxseVxuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc3NpZ246ICggUC4uLiApIC0+IGNsZWFuX2Fzc2lnbiBAZGF0YSwgUC4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZmFpbDogKCBtZXNzYWdlLCBQLi4uICkgLT4gY2xlYW5fYXNzaWduIEBkYXRhLCB7IG1lc3NhZ2UsIH0sIFAuLi47IGZhbHNlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBUeXBlc3BhY2VcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgZm9yIG5hbWUgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2xhc3pcbiAgICAgIGNsYXNzIFR5cGVjbGFzcyBleHRlbmRzIFR5cGVcbiAgICAgIG5hbWVpdCBuYW1lLCBUeXBlY2xhc3NcbiAgICAgIEBbIG5hbWUgXSA9IG5ldyBUeXBlY2xhc3MgQCwgbmFtZSwgaXNhID0gY2xhc3pbIG5hbWUgXVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiMgSE9MTEVSSVRIIFRZUEVTUEFDRVxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhfdHlwZXNwYWNlIGV4dGVuZHMgVHlwZXNwYWNlXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAdGV4dDogICAgICAgICAgICggeCApIC0+ICggdHlwZV9vZiB4ICkgaXMgJ3RleHQnXG4gIEBub25lbXB0eV90ZXh0OiAgKCB4ICkgLT4gKCBAVC50ZXh0LmlzYSB4ICkgYW5kIHgubGVuZ3RoID4gMFxuICBAZmxvYXQ6ICAgICAgICAgICggeCApIC0+IE51bWJlci5pc0Zpbml0ZSB4XG4gIEBpbnRlZ2VyOiAgICAgICAgKCB4ICkgLT4gTnVtYmVyLmlzU2FmZUludGVnZXIgeFxuICBAcGludGVnZXI6ICAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCB4ID4gMFxuICBAenBpbnRlZ2VyOiAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCB4ID49IDBcbiAgQGNhcmRpbmFsOiAgICAgICAoIHggKSAtPiBAVC56cGludGVnZXIuaXNhIHhcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGltZW5zaW9uOiAgICAgICggeCApIC0+IEBULnBpbnRlZ2VyLmlzYSAgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGluY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgIyBAYXNzaWduIHsgaWFtOiAnaW5jcmVtZW50YWxfdGV4dCcsIH1cbiAgICBAYXNzaWduIHsgY2hyczogKCBBcnJheS5mcm9tIHggKSwgfVxuICAgIGRlYnVnICfOqWJza19fXzUnLCBAZGF0YVxuICAgIHJldHVybiBfdGVzdF9tb25vdG9ueS5jYWxsIEAsIHgsICc8J1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRlY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgQGFzc2lnbiB7IGNocnM6ICggQXJyYXkuZnJvbSB4ICksIH1cbiAgICByZXR1cm4gX3Rlc3RfbW9ub3RvbnkuY2FsbCBALCB4LCAnPidcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBubWFnX2JhcmVfcmV2ZXJzZWQ6ICAoIHggKSAtPiBAVC5pbmNyZW1lbnRhbF90ZXh0LmlzYW1lIEAsIHhcbiAgQHBtYWdfYmFyZTogICAgICAgICAgICggeCApIC0+IEBULmluY3JlbWVudGFsX3RleHQuaXNhbWUgQCwgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQG1hZ25pZmllcnM6ICggeCApIC0+XG4gICAgcmV0dXJuICggQGZhaWwgXCJleHBlY3RlZCBhIG1hZ25pZmllciwgZ290IGFuIGVtcHR5IHRleHRcIiApIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmlzYSB4XG4gICAgWyBubWFnX2JhcmVfcmV2ZXJzZWQsXG4gICAgICBwbWFnX2JhcmUsICBdID0geC5zcGxpdCAvXFxzKy92XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEBhc3NpZ24geyBpYW06ICdtYWduaWZpZXJzJywgfTsgZGVidWcgJ86pYnNrX19fNicsIEBkYXRhXG4gICAgcmV0dXJuICggQGZhaWwgXCI/Pz9cIiApIHVubGVzcyAgQFQubm1hZ19iYXJlX3JldmVyc2VkLmlzYW1lICBALCB7IGNocnM6ICdubWFnX2NocnMnLCB9LCBubWFnX2JhcmVfcmV2ZXJzZWRcbiAgICByZXR1cm4gKCBAZmFpbCBcIj8/P1wiICkgdW5sZXNzICBAVC5wbWFnX2JhcmUuaXNhbWUgICAgICAgICAgIEAsIHsgY2hyczogJ3BtYWdfY2hycycsIH0sIHBtYWdfYmFyZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbm1hZyAgICAgICAgICAgID0gJyAnICsgbm1hZ19iYXJlX3JldmVyc2VkLnJldmVyc2UoKVxuICAgIHBtYWcgICAgICAgICAgICA9ICcgJyArIHBtYWdfYmFyZVxuICAgIEBhc3NpZ24geyBubWFnLCBwbWFnLCB9XG4gICAgcmV0dXJuIHRydWVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbl90ZXN0X21vbm90b255ID0gKCB4LCBjbXAgKSAtPlxuICB7IGNocnMsIH0gPSBAZGF0YSAjID0gQGNyZWF0ZSBkYXRhXG4gIHJldHVybiAoIEBmYWlsIFwiZW1wdHkgaXMgbm90IG1vbm90b25pY1wiICkgaWYgY2hycy5sZW5ndGggaXMgMFxuICByZXR1cm4gdHJ1ZSAgIGlmIGNocnMubGVuZ3RoIGlzIDFcbiAgZm9yIGlkeCBpbiBbIDEgLi4uIGNocnMubGVuZ3RoIF1cbiAgICBwcnZfY2hyID0gY2hyc1sgaWR4IC0gMSBdXG4gICAgY2hyICAgICA9IGNocnNbIGlkeCAgICAgXVxuICAgIFIgICAgICAgPSBzd2l0Y2ggY21wXG4gICAgICB3aGVuICc+JyB0aGVuIHBydl9jaHIgPiBjaHJcbiAgICAgIHdoZW4gJzwnIHRoZW4gcHJ2X2NociA8IGNoclxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJza19fXzcgKGludGVybmFsKSBleHBlY3RlZCAnPicgb3IgJzwnLCBnb3QgI3tycHIgY21wfVwiXG4gICAgY29udGludWUgaWYgUlxuICAgIEBhc3NpZ24geyBmYWlsOiB7IHgsIGlkeCwgcHJ2X2NociwgY2hyLCB9LCB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cyxcbiAgdHlwZXM6ICAgICAgbmV3IEhvbGxlcml0aF90eXBlc3BhY2UoKVxuICBpbnRlcm5hbHM6IHtcbiAgICBUeXBlXG4gICAgVHlwZXNwYWNlXG4gICAgSG9sbGVyaXRoX3R5cGVzcGFjZVxuICAgICMgQm91bmRlZF9saXN0XG4gICAgfVxuIl19
