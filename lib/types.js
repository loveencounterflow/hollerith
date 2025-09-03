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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxtQkFBQSxFQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLGNBQUEsRUFBQSxZQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBOzs7RUFHQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCOztFQUVBLENBQUEsQ0FBRSxNQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLGNBQVYsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsRUFDRSxJQURGLENBQUEsR0FDNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxhQUFuQixDQUFBLENBRDVCLEVBWkE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBNENNLE9BQU4sTUFBQSxLQUFBLENBQUE7O0lBR0UsV0FBYSxDQUFFLFNBQUYsRUFBYSxJ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QUE7QUFDakIsUUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQTtJQUFFLENBQUEsQ0FBRSxJQUFGLENBQUEsR0FBWSxJQUFDLENBQUEsSUFBYixFQUFGO0lBQ0UsSUFBNkMsSUFBSSxDQUFDLE1BQUwsS0FBZSxDQUE1RDtBQUFBLGFBQVMsSUFBQyxDQUFBLElBQUQsQ0FBTSx3QkFBTixFQUFUOztJQUNBLElBQWlCLElBQUksQ0FBQyxNQUFMLEtBQWUsQ0FBaEM7QUFBQSxhQUFPLEtBQVA7O0lBQ0EsS0FBVywwRkFBWDtNQUNFLE9BQUEsR0FBVSxJQUFJLENBQUUsR0FBQSxHQUFNLENBQVI7TUFDZCxHQUFBLEdBQVUsSUFBSSxDQUFFLEdBQUY7TUFDZCxDQUFBO0FBQVUsZ0JBQU8sR0FBUDtBQUFBLGVBQ0gsR0FERzttQkFDTSxPQUFBLEdBQVU7QUFEaEIsZUFFSCxHQUZHO21CQUVNLE9BQUEsR0FBVTtBQUZoQjtZQUdILE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSw2Q0FBQSxDQUFBLENBQWdELEdBQUEsQ0FBSSxHQUFKLENBQWhELENBQUEsQ0FBVjtBQUhIOztNQUlWLElBQVksQ0FBWjtBQUFBLGlCQUFBOztNQUNBLElBQUMsQ0FBQSxNQUFELENBQVE7UUFBRSxJQUFBLEVBQU0sQ0FBRSxDQUFGLEVBQUssR0FBTCxFQUFVLE9BQVYsRUFBbUIsR0FBbkI7TUFBUixDQUFSO0FBQ0EsYUFBTztJQVRUO0FBVUEsV0FBTztFQWRRLEVBdktqQjs7O0VBd0xBLE1BQU0sQ0FBQyxNQUFQLENBQWMsTUFBTSxDQUFDLE9BQXJCLEVBQ0U7SUFBQSxLQUFBLEVBQVksSUFBSSxtQkFBSixDQUFBLENBQVo7SUFDQSxTQUFBLEVBQVcsQ0FDVCxJQURTLEVBRVQsU0FGUyxFQUdULG1CQUhTO0VBRFgsQ0FERjs7RUF4TEE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgaGlkZSxcbiAgc2V0X2dldHRlciwgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9tYW5hZ2VkX3Byb3BlcnR5X3Rvb2xzKClcbnsgbmFtZWl0LCAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMucmVxdWlyZV9uYW1laXQoKVxueyBjbGVhbl9hc3NpZ24sICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG57IHJlbWFwLFxuICBvbWl0LCAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3JlbWFwKClcblxuXG4jICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyAjIyMgTk9URSBGdXR1cmUgU2luZ2xlLUZpbGUgTW9kdWxlICMjI1xuIyBjbGFzcyBCb3VuZGVkX2xpc3RcblxuIyAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgICBjb25zdHJ1Y3RvcjogKCBtYXhfc2l6ZSA9IDMgKSAtPlxuIyAgICAgQG1heF9zaXplICAgPSBtYXhfc2l6ZVxuIyAgICAgQGRhdGEgICAgICAgPSBbXVxuIyAgICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4jICAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyAgIGNyZWF0ZTogKCBQLi4uICkgLT5cbiMgICAgIEBkYXRhLnB1c2ggY2xlYW5fYXNzaWduIHt9LCBQLi4uXG4jICAgICBAZGF0YS5zaGlmdCgpIGlmIEBzaXplID4gQG1heF9zaXplXG4jICAgICByZXR1cm4gQGN1cnJlbnRcblxuIyAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgICBhc3NpZ246ICggUC4uLiAgKSAtPiBjbGVhbl9hc3NpZ24gQGN1cnJlbnQsIFAuLi5cbiMgICBhdDogICAgICggaWR4ICAgKSAtPiBAZGF0YS5hdCBpZHhcblxuIyAgICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgICBzZXRfZ2V0dGVyIEA6OiwgJ3NpemUnLCAgICAgLT4gQGRhdGEubGVuZ3RoXG4jICAgc2V0X2dldHRlciBAOjosICdpc19lbXB0eScsIC0+IEBkYXRhLmxlbmd0aCBpcyAwXG4jICAgc2V0X2dldHRlciBAOjosICdjdXJyZW50JywgIC0+IGlmIEBpc19lbXB0eSB0aGVuIEBjcmVhdGUoKSBlbHNlIEBhdCAtMVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyMjIE5PVEUgRnV0dXJlIFNpbmdsZS1GaWxlIE1vZHVsZSAjIyNcbmNsYXNzIFR5cGVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIHR5cGVzcGFjZSwgbmFtZSwgaXNhICkgLT5cbiAgICBoaWRlIEAsICduYW1lJywgICBuYW1lXG4gICAgaGlkZSBALCAnVCcsICAgICAgdHlwZXNwYWNlXG4gICAgaGlkZSBALCAnX2lzYScsICAgaXNhXG4gICAgQGRhdGEgICAgICAgICAgID0ge30gIyBuZXcgQm91bmRlZF9saXN0KClcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBpc2E6ICggeCApIC0+XG4gICAgIyB0cnlcbiAgICAjICAgKCBuZXcgVGVzdCBndXl0ZXN0X2NmZyApLnRlc3QgeyB0eXBlczogQGhvbGxlcml0aC50eXBlcywgfVxuICAgICMgZmluYWxseVxuICAgICMgICBkZWJ1ZyAnzqlobGx0X19fMScsIFwiZXJyb3JcIlxuICAgIEBkYXRhID0ge307IFIgPSBAX2lzYS5jYWxsIEAsIHhcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhbWU6ICggY2FsbGVyLCBtYXBwaW5nLCB4ICkgLT5cbiAgICAjIHRyeVxuICAgICMgICAoIG5ldyBUZXN0IGd1eXRlc3RfY2ZnICkudGVzdCB7IHR5cGVzOiBAaG9sbGVyaXRoLnR5cGVzLCB9XG4gICAgIyBmaW5hbGx5XG4gICAgIyAgIGRlYnVnICfOqWhsbHRfX18yJywgXCJlcnJvclwiXG4gICAgc3dpdGNoIGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgd2hlbiAyXG4gICAgICAgIFsgY2FsbGVyLCBtYXBwaW5nLCB4LCBdID0gWyBjYWxsZXIsIG51bGwsIG1hcHBpbmcsIF1cbiAgICAgICAgUiAgICAgICAgICAgICAgICAgICAgICAgPSBAX2lzYS5jYWxsIGNhbGxlciwgeFxuICAgICAgd2hlbiAzXG4gICAgICAgIG9yaWdpbmFsX2RhdGEgICAgICAgICAgID0gY2FsbGVyLmRhdGFcbiAgICAgICAgY2FsbGVyLmRhdGEgICAgICAgICAgICAgPSBPYmplY3QuYXNzaWduIHt9LCBjYWxsZXIuZGF0YVxuICAgICAgICBSICAgICAgICAgICAgICAgICAgICAgICA9IEBfaXNhLmNhbGwgY2FsbGVyLCB4XG4gICAgICAgIGNhbGxlci5kYXRhICAgICAgICAgICAgID0gT2JqZWN0LmFzc2lnbiBvcmlnaW5hbF9kYXRhLCAoIHJlbWFwIGNhbGxlci5kYXRhLCBtYXBwaW5nIClcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlic2tfX18zIGV4cGVjdGVkIDIgb3IgMyBhcmd1bWVudHMsIGdvdCAje2FyaXR5fVwiXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYTI6ICggeCwgZGF0YSA9IG51bGwsIG1hcHBpbmcgPSBudWxsICkgLT5cbiAgICAjIHRyeVxuICAgIEBkYXRhICAgPSB7fVxuICAgIFIgICAgICAgPSBAX2lzYS5jYWxsIEAsIHhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGRhdGE/XG4gICAgICBpZiBtYXBwaW5nPyAgICAgdGhlbiAgY2xlYW5fYXNzaWduIGRhdGEsICggcmVtYXAgKCBjbGVhbl9hc3NpZ24ge30sIEBkYXRhICksIG1hcHBpbmcgKSAgIyMjIGQxIG0xICMjI1xuICAgICAgZWxzZSAgICAgICAgICAgICAgICAgIGNsZWFuX2Fzc2lnbiBkYXRhLCBAZGF0YSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMjIyBkMSBtMCAjIyNcbiAgICBlbHNlIGlmIG1hcHBpbmc/ICB0aGVuICByZW1hcCBAZGF0YSwgbWFwcGluZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIyMgZDAgbTEgIyMjXG4gICAgcmV0dXJuIFIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyMjIGQwIG0wICMjI1xuICAgICMgZmluYWxseVxuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhc3NpZ246ICggUC4uLiApIC0+IGNsZWFuX2Fzc2lnbiBAZGF0YSwgUC4uLlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZmFpbDogKCBtZXNzYWdlLCBQLi4uICkgLT4gY2xlYW5fYXNzaWduIEBkYXRhLCB7IG1lc3NhZ2UsIH0sIFAuLi47IGZhbHNlXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBUeXBlc3BhY2VcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIGNsYXN6ID0gQGNvbnN0cnVjdG9yXG4gICAgZm9yIG5hbWUgaW4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2xhc3pcbiAgICAgIGNsYXNzIFR5cGVjbGFzcyBleHRlbmRzIFR5cGVcbiAgICAgIG5hbWVpdCBuYW1lLCBUeXBlY2xhc3NcbiAgICAgIEBbIG5hbWUgXSA9IG5ldyBUeXBlY2xhc3MgQCwgbmFtZSwgaXNhID0gY2xhc3pbIG5hbWUgXVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4jIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiMgSE9MTEVSSVRIIFRZUEVTUEFDRVxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhfdHlwZXNwYWNlIGV4dGVuZHMgVHlwZXNwYWNlXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAdGV4dDogICAgICAgICAgICggeCApIC0+ICggdHlwZV9vZiB4ICkgaXMgJ3RleHQnXG4gIEBub25lbXB0eV90ZXh0OiAgKCB4ICkgLT4gKCBAVC50ZXh0LmlzYSB4ICkgYW5kIHgubGVuZ3RoID4gMFxuICBAZmxvYXQ6ICAgICAgICAgICggeCApIC0+IE51bWJlci5pc0Zpbml0ZSB4XG4gIEBpbnRlZ2VyOiAgICAgICAgKCB4ICkgLT4gTnVtYmVyLmlzU2FmZUludGVnZXIgeFxuICBAcGludGVnZXI6ICAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCB4ID4gMFxuICBAenBpbnRlZ2VyOiAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCB4ID49IDBcbiAgQGNhcmRpbmFsOiAgICAgICAoIHggKSAtPiBAVC56cGludGVnZXIuaXNhIHhcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGltZW5zaW9uOiAgICAgICggeCApIC0+IEBULnBpbnRlZ2VyLmlzYSAgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGluY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgIyBAYXNzaWduIHsgaWFtOiAnaW5jcmVtZW50YWxfdGV4dCcsIH1cbiAgICBAYXNzaWduIHsgY2hyczogKCBBcnJheS5mcm9tIHggKSwgfVxuICAgIGRlYnVnICfOqWJza19fXzUnLCBAZGF0YVxuICAgIHJldHVybiBfdGVzdF9tb25vdG9ueS5jYWxsIEAsIHgsICc8J1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRlY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgQGFzc2lnbiB7IGNocnM6ICggQXJyYXkuZnJvbSB4ICksIH1cbiAgICByZXR1cm4gX3Rlc3RfbW9ub3RvbnkuY2FsbCBALCB4LCAnPidcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBubWFnX2JhcmVfcmV2ZXJzZWQ6ICAoIHggKSAtPiBAVC5pbmNyZW1lbnRhbF90ZXh0LmlzYW1lIEAsIHhcbiAgQHBtYWdfYmFyZTogICAgICAgICAgICggeCApIC0+IEBULmluY3JlbWVudGFsX3RleHQuaXNhbWUgQCwgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQG1hZ25pZmllcnM6ICggeCApIC0+XG4gICAgcmV0dXJuICggQGZhaWwgXCJleHBlY3RlZCBhIG1hZ25pZmllciwgZ290IGFuIGVtcHR5IHRleHRcIiApIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmlzYSB4XG4gICAgWyBubWFnX2JhcmVfcmV2ZXJzZWQsXG4gICAgICBwbWFnX2JhcmUsICBdID0geC5zcGxpdCAvXFxzKy92XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEBhc3NpZ24geyBpYW06ICdtYWduaWZpZXJzJywgfTsgZGVidWcgJ86pYnNrX19fNicsIEBkYXRhXG4gICAgcmV0dXJuICggQGZhaWwgXCI/Pz9cIiApIHVubGVzcyAgQFQubm1hZ19iYXJlX3JldmVyc2VkLmlzYW1lICBALCB7IGNocnM6ICdubWFnX2NocnMnLCB9LCBubWFnX2JhcmVfcmV2ZXJzZWRcbiAgICByZXR1cm4gKCBAZmFpbCBcIj8/P1wiICkgdW5sZXNzICBAVC5wbWFnX2JhcmUuaXNhbWUgICAgICAgICAgIEAsIHsgY2hyczogJ3BtYWdfY2hycycsIH0sIHBtYWdfYmFyZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbm1hZyAgICAgICAgICAgID0gJyAnICsgbm1hZ19iYXJlX3JldmVyc2VkLnJldmVyc2UoKVxuICAgIHBtYWcgICAgICAgICAgICA9ICcgJyArIHBtYWdfYmFyZVxuICAgIEBhc3NpZ24geyBubWFnLCBwbWFnLCB9XG4gICAgcmV0dXJuIHRydWVcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbl90ZXN0X21vbm90b255ID0gKCB4LCBjbXAgKSAtPlxuICB7IGNocnMsIH0gPSBAZGF0YSAjID0gQGNyZWF0ZSBkYXRhXG4gIHJldHVybiAoIEBmYWlsIFwiZW1wdHkgaXMgbm90IG1vbm90b25pY1wiICkgaWYgY2hycy5sZW5ndGggaXMgMFxuICByZXR1cm4gdHJ1ZSAgIGlmIGNocnMubGVuZ3RoIGlzIDFcbiAgZm9yIGlkeCBpbiBbIDEgLi4uIGNocnMubGVuZ3RoIF1cbiAgICBwcnZfY2hyID0gY2hyc1sgaWR4IC0gMSBdXG4gICAgY2hyICAgICA9IGNocnNbIGlkeCAgICAgXVxuICAgIFIgICAgICAgPSBzd2l0Y2ggY21wXG4gICAgICB3aGVuICc+JyB0aGVuIHBydl9jaHIgPiBjaHJcbiAgICAgIHdoZW4gJzwnIHRoZW4gcHJ2X2NociA8IGNoclxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJza19fXzcgKGludGVybmFsKSBleHBlY3RlZCAnPicgb3IgJzwnLCBnb3QgI3tycHIgY21wfVwiXG4gICAgY29udGludWUgaWYgUlxuICAgIEBhc3NpZ24geyBmYWlsOiB7IHgsIGlkeCwgcHJ2X2NociwgY2hyLCB9LCB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cyxcbiAgdHlwZXM6ICAgICAgbmV3IEhvbGxlcml0aF90eXBlc3BhY2UoKVxuICBpbnRlcm5hbHM6IHtcbiAgICBUeXBlXG4gICAgVHlwZXNwYWNlXG4gICAgSG9sbGVyaXRoX3R5cGVzcGFjZVxuICAgICMgQm91bmRlZF9saXN0XG4gICAgfVxuIl19
