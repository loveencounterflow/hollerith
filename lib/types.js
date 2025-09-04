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
    isa2(x, data = null, mapping = null) {
      var R;
      this.data = {};
      R = this._isa.call(this, x);
      //.......................................................................................................
      if (data != null) {
        if (mapping != null) {
          clean_assign(data, remap(clean_assign({}, this.data), mapping));
        } else {
          /* d1 m1 */          clean_assign(data, this.data);
        }
      } else /* d1 m0 */if (mapping != null) {
        remap(this.data, mapping);
      }
/* d0 m1 */      return R/* d0 m0 */;
    }

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
      return this.T.incremental_text.isa2(x, this.data);
    }

    static pmag_bare(x) {
      return this.T.incremental_text.isa2(x, this.data);
    }

    //---------------------------------------------------------------------------------------------------------
    static magnifiers(x) {
      var nmag, nmag_bare_reversed, pmag, pmag_bare;
      if (!this.T.nonempty_text.isa(x)) {
        return this.fail("expected a magnifier, got an empty text");
      }
      [nmag_bare_reversed, pmag_bare] = x.split(/\s+/v);
      if (!this.T.nmag_bare_reversed.isa2(nmag_bare_reversed, this.data, {
        chrs: 'nmag_chrs'
      })) {
        //.......................................................................................................
        // @assign { iam: 'magnifiers', }; debug 'Ωbsk___6', @data
        return this.fail("???");
      }
      if (!this.T.pmag_bare.isa2(pmag_bare, this.data, {
        chrs: 'pmag_chrs'
      })) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxtQkFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBOzs7RUFHQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCOztFQUVBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLGNBQVYsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFuQixDQUFBLENBRDVCLEVBWkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBNENNLE9BQU4sTUFBQSxLQUFBLENBQUE7O0lBR0UsV0FBYSxDQUFFLFNBQUYsRUFBYSxJ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QUFDQSxhQUFPO0lBVFQ7QUFVQSxXQUFPO0VBZFEsRUFqSmpCOzs7RUFrS0EsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFDRTtJQUFBLEtBQUEsRUFBWSxJQUFJLG1CQUFKLENBQUEsQ0FBWjtJQUNBLFNBQUEsRUFBVyxDQUNULElBRFMsRUFFVCxTQUZTLEVBR1QsbUJBSFM7RUFEWCxDQURGOztFQWxLQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBoaWRlLFxuICBzZXRfZ2V0dGVyLCAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX21hbmFnZWRfcHJvcGVydHlfdG9vbHMoKVxueyBuYW1laXQsICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy5yZXF1aXJlX25hbWVpdCgpXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgcmVtYXAsXG4gIG9taXQsICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfcmVtYXAoKVxuXG5cbiMgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jICMjIyBOT1RFIEZ1dHVyZSBTaW5nbGUtRmlsZSBNb2R1bGUgIyMjXG4jIGNsYXNzIEJvdW5kZWRfbGlzdFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIGNvbnN0cnVjdG9yOiAoIG1heF9zaXplID0gMyApIC0+XG4jICAgICBAbWF4X3NpemUgICA9IG1heF9zaXplXG4jICAgICBAZGF0YSAgICAgICA9IFtdXG4jICAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiMgICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jICAgY3JlYXRlOiAoIFAuLi4gKSAtPlxuIyAgICAgQGRhdGEucHVzaCBjbGVhbl9hc3NpZ24ge30sIFAuLi5cbiMgICAgIEBkYXRhLnNoaWZ0KCkgaWYgQHNpemUgPiBAbWF4X3NpemVcbiMgICAgIHJldHVybiBAY3VycmVudFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIGFzc2lnbjogKCBQLi4uICApIC0+IGNsZWFuX2Fzc2lnbiBAY3VycmVudCwgUC4uLlxuIyAgIGF0OiAgICAgKCBpZHggICApIC0+IEBkYXRhLmF0IGlkeFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIHNldF9nZXR0ZXIgQDo6LCAnc2l6ZScsICAgICAtPiBAZGF0YS5sZW5ndGhcbiMgICBzZXRfZ2V0dGVyIEA6OiwgJ2lzX2VtcHR5JywgLT4gQGRhdGEubGVuZ3RoIGlzIDBcbiMgICBzZXRfZ2V0dGVyIEA6OiwgJ2N1cnJlbnQnLCAgLT4gaWYgQGlzX2VtcHR5IHRoZW4gQGNyZWF0ZSgpIGVsc2UgQGF0IC0xXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuY2xhc3MgVHlwZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggdHlwZXNwYWNlLCBuYW1lLCBpc2EgKSAtPlxuICAgIGhpZGUgQCwgJ25hbWUnLCAgIG5hbWVcbiAgICBoaWRlIEAsICdUJywgICAgICB0eXBlc3BhY2VcbiAgICBoaWRlIEAsICdfaXNhJywgICBpc2FcbiAgICBAZGF0YSAgICAgICAgICAgPSB7fSAjIG5ldyBCb3VuZGVkX2xpc3QoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYTogKCB4ICkgLT5cbiAgICAjIHRyeVxuICAgICMgICAoIG5ldyBUZXN0IGd1eXRlc3RfY2ZnICkudGVzdCB7IHR5cGVzOiBAaG9sbGVyaXRoLnR5cGVzLCB9XG4gICAgIyBmaW5hbGx5XG4gICAgIyAgIGRlYnVnICfOqWhsbHRfX18xJywgXCJlcnJvclwiXG4gICAgQGRhdGEgPSB7fTsgUiA9IEBfaXNhLmNhbGwgQCwgeFxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2EyOiAoIHgsIGRhdGEgPSBudWxsLCBtYXBwaW5nID0gbnVsbCApIC0+XG4gICAgQGRhdGEgICA9IHt9XG4gICAgUiAgICAgICA9IEBfaXNhLmNhbGwgQCwgeFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgZGF0YT9cbiAgICAgIGlmIG1hcHBpbmc/ICAgICB0aGVuICBjbGVhbl9hc3NpZ24gZGF0YSwgKCByZW1hcCAoIGNsZWFuX2Fzc2lnbiB7fSwgQGRhdGEgKSwgbWFwcGluZyApICAjIyMgZDEgbTEgIyMjXG4gICAgICBlbHNlICAgICAgICAgICAgICAgICAgY2xlYW5fYXNzaWduIGRhdGEsICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBkYXRhICAgICAgICAgICAgICAgIyMjIGQxIG0wICMjI1xuICAgIGVsc2UgaWYgbWFwcGluZz8gIHRoZW4gICAgICAgICAgICAgICAgICAgICAgIHJlbWFwICAgICAgICAgICAgICAgICAgICBAZGF0YSwgICBtYXBwaW5nICAgICMjIyBkMCBtMSAjIyNcbiAgICByZXR1cm4gUiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyMgZDAgbTAgIyMjXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc3NpZ246ICggUC4uLiApIC0+IGNsZWFuX2Fzc2lnbiBAZGF0YSwgUC4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZmFpbDogKCBtZXNzYWdlLCBQLi4uICkgLT4gY2xlYW5fYXNzaWduIEBkYXRhLCB7IG1lc3NhZ2UsIH0sIFAuLi47IGZhbHNlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBUeXBlc3BhY2VcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgZm9yIG5hbWUgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2xhc3pcbiAgICAgIGNsYXNzIFR5cGVjbGFzcyBleHRlbmRzIFR5cGVcbiAgICAgIG5hbWVpdCBuYW1lLCBUeXBlY2xhc3NcbiAgICAgIEBbIG5hbWUgXSA9IG5ldyBUeXBlY2xhc3MgQCwgbmFtZSwgaXNhID0gY2xhc3pbIG5hbWUgXVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiMgSE9MTEVSSVRIIFRZUEVTUEFDRVxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhfdHlwZXNwYWNlIGV4dGVuZHMgVHlwZXNwYWNlXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAdGV4dDogICAgICAgICAgICggeCApIC0+ICggdHlwZV9vZiB4ICkgaXMgJ3RleHQnXG4gIEBub25lbXB0eV90ZXh0OiAgKCB4ICkgLT4gKCBAVC50ZXh0LmlzYSB4ICkgYW5kIHgubGVuZ3RoID4gMFxuICBAZmxvYXQ6ICAgICAgICAgICggeCApIC0+IE51bWJlci5pc0Zpbml0ZSB4XG4gIEBpbnRlZ2VyOiAgICAgICAgKCB4ICkgLT4gTnVtYmVyLmlzU2FmZUludGVnZXIgeFxuICBAcGludGVnZXI6ICAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCB4ID4gMFxuICBAenBpbnRlZ2VyOiAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCB4ID49IDBcbiAgQGNhcmRpbmFsOiAgICAgICAoIHggKSAtPiBAVC56cGludGVnZXIuaXNhIHhcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGltZW5zaW9uOiAgICAgICggeCApIC0+IEBULnBpbnRlZ2VyLmlzYSAgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGluY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgIyBAYXNzaWduIHsgaWFtOiAnaW5jcmVtZW50YWxfdGV4dCcsIH1cbiAgICBAYXNzaWduIHsgY2hyczogKCBBcnJheS5mcm9tIHggKSwgfVxuICAgIGRlYnVnICfOqWJza19fXzUnLCBAZGF0YVxuICAgIHJldHVybiBfdGVzdF9tb25vdG9ueS5jYWxsIEAsIHgsICc8J1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRlY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgQGFzc2lnbiB7IGNocnM6ICggQXJyYXkuZnJvbSB4ICksIH1cbiAgICByZXR1cm4gX3Rlc3RfbW9ub3RvbnkuY2FsbCBALCB4LCAnPidcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBubWFnX2JhcmVfcmV2ZXJzZWQ6ICAoIHggKSAtPiBAVC5pbmNyZW1lbnRhbF90ZXh0LmlzYTIgeCwgQGRhdGFcbiAgQHBtYWdfYmFyZTogICAgICAgICAgICggeCApIC0+IEBULmluY3JlbWVudGFsX3RleHQuaXNhMiB4LCBAZGF0YVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQG1hZ25pZmllcnM6ICggeCApIC0+XG4gICAgcmV0dXJuICggQGZhaWwgXCJleHBlY3RlZCBhIG1hZ25pZmllciwgZ290IGFuIGVtcHR5IHRleHRcIiApIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmlzYSB4XG4gICAgWyBubWFnX2JhcmVfcmV2ZXJzZWQsXG4gICAgICBwbWFnX2JhcmUsICBdID0geC5zcGxpdCAvXFxzKy92XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEBhc3NpZ24geyBpYW06ICdtYWduaWZpZXJzJywgfTsgZGVidWcgJ86pYnNrX19fNicsIEBkYXRhXG4gICAgcmV0dXJuICggQGZhaWwgXCI/Pz9cIiApIHVubGVzcyAgQFQubm1hZ19iYXJlX3JldmVyc2VkLmlzYTIgbm1hZ19iYXJlX3JldmVyc2VkLCBAZGF0YSwgeyBjaHJzOiAnbm1hZ19jaHJzJywgfVxuICAgIHJldHVybiAoIEBmYWlsIFwiPz8/XCIgKSB1bmxlc3MgIEBULnBtYWdfYmFyZS5pc2EyICAgICAgICAgIHBtYWdfYmFyZSwgICAgICAgICAgQGRhdGEsIHsgY2hyczogJ3BtYWdfY2hycycsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG5tYWcgICAgICAgICAgICA9ICcgJyArIG5tYWdfYmFyZV9yZXZlcnNlZC5yZXZlcnNlKClcbiAgICBwbWFnICAgICAgICAgICAgPSAnICcgKyBwbWFnX2JhcmVcbiAgICBAYXNzaWduIHsgbm1hZywgcG1hZywgfVxuICAgIHJldHVybiB0cnVlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5fdGVzdF9tb25vdG9ueSA9ICggeCwgY21wICkgLT5cbiAgeyBjaHJzLCB9ID0gQGRhdGEgIyA9IEBjcmVhdGUgZGF0YVxuICByZXR1cm4gKCBAZmFpbCBcImVtcHR5IGlzIG5vdCBtb25vdG9uaWNcIiApIGlmIGNocnMubGVuZ3RoIGlzIDBcbiAgcmV0dXJuIHRydWUgICBpZiBjaHJzLmxlbmd0aCBpcyAxXG4gIGZvciBpZHggaW4gWyAxIC4uLiBjaHJzLmxlbmd0aCBdXG4gICAgcHJ2X2NociA9IGNocnNbIGlkeCAtIDEgXVxuICAgIGNociAgICAgPSBjaHJzWyBpZHggICAgIF1cbiAgICBSICAgICAgID0gc3dpdGNoIGNtcFxuICAgICAgd2hlbiAnPicgdGhlbiBwcnZfY2hyID4gY2hyXG4gICAgICB3aGVuICc8JyB0aGVuIHBydl9jaHIgPCBjaHJcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yIFwizqlic2tfX183IChpbnRlcm5hbCkgZXhwZWN0ZWQgJz4nIG9yICc8JywgZ290ICN7cnByIGNtcH1cIlxuICAgIGNvbnRpbnVlIGlmIFJcbiAgICBAYXNzaWduIHsgZmFpbDogeyB4LCBpZHgsIHBydl9jaHIsIGNociwgfSwgfVxuICAgIHJldHVybiBmYWxzZVxuICByZXR1cm4gdHJ1ZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbk9iamVjdC5hc3NpZ24gbW9kdWxlLmV4cG9ydHMsXG4gIHR5cGVzOiAgICAgIG5ldyBIb2xsZXJpdGhfdHlwZXNwYWNlKClcbiAgaW50ZXJuYWxzOiB7XG4gICAgVHlwZVxuICAgIFR5cGVzcGFjZVxuICAgIEhvbGxlcml0aF90eXBlc3BhY2VcbiAgICAjIEJvdW5kZWRfbGlzdFxuICAgIH1cbiJdfQ==
