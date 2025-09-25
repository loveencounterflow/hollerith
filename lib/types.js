(function() {
  'use strict';
  var CFG, Hollerith_typespace, SFMODULES, Type, Typespace, _test_monotony, debug, freeze, get_max_integer, internals, is_positive_all_niner, is_positive_integer_power_of, regex, rpr, type_of;

  //===========================================================================================================
  SFMODULES = require('bricabrac-sfmodules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({debug} = console);

  ({regex} = require('regex'));

  ({freeze} = Object);

  ({Type, Typespace, CFG} = SFMODULES.unstable.require_nanotypes());

  // get_max_niner_digit_count,
  // encode,
  // decode,
  // log_to_base,
  // get_required_digits,
  ({is_positive_integer_power_of, is_positive_all_niner, get_max_integer} = SFMODULES.unstable.require_anybase());

  //===========================================================================================================
  internals = Object.assign({Type, Typespace}, {
    //---------------------------------------------------------------------------------------------------------
    get_leading_novas_re: function(_nova) {
      return (regex('g'))` ^ ${_nova}* (?= .+ $ ) `;
    }
  });

  Hollerith_typespace = (function() {
    //===========================================================================================================
    // HOLLERITH TYPESPACE
    //===========================================================================================================
    class Hollerith_typespace extends Typespace {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var blank_esc, blank_splitter;
        super(cfg);
        this.blank.validate(this[CFG].blank);
        blank_esc = RegExp.escape(this[CFG].blank);
        blank_splitter = new RegExp(`(?:${blank_esc})+`, 'gv');
        this[CFG] = freeze({...this[CFG], blank_splitter});
        return void 0;
      }

      //=========================================================================================================
      static boolean(x) {
        return (x === false) || (x === true);
      }

      static list(x) {
        return (type_of(x)) === 'list';
      }

      static text(x) {
        return (type_of(x)) === 'text';
      }

      static nonempty_text(x) {
        return (this.T.text.isa(x)) && (x.length > 0);
      }

      static character(x) {
        return (this.T.text.isa(x)) && (/^.$/v.test(x));
      }

      static float(x) {
        return Number.isFinite(x);
      }

      static integer(x) {
        return Number.isSafeInteger(x);
      }

      static pinteger(x) {
        return (this.T.integer.isa(x)) && (x > 0);
      }

      static zpinteger(x) {
        return (this.T.integer.isa(x)) && (x >= 0);
      }

      static cardinal(x) {
        return this.T.zpinteger.isa(x);
      }

      //---------------------------------------------------------------------------------------------------------
      static hollerith(x) {
        return x instanceof (require('./main')).Hollerith;
      }

      //---------------------------------------------------------------------------------------------------------
      /* NOTE requiring `x` to be both a character and equal to `@[CFG].blank` means `@[CFG].blank` itself can be tested */
      static blank(x) {
        return (this.T.character.isa(x)) && (x === this[CFG].blank);
      }

      static dimension(x) {
        return this.T.pinteger.isa(x);
      }

      static cardinals_only(x) {
        return this.T.boolean.isa(x);
      }

      static _base(x) {
        return (this.T.pinteger.isa(x)) && (x > 1);
      }

      // @digits_per_idx:  ( x ) -> ( @T.pinteger.isa x ) and ( x > 1 )

        // #---------------------------------------------------------------------------------------------------------
      // @placeholder: ( x ) ->
      //   return false unless ( @T.character.isa x )
      //   placeholder_esc   = RegExp.escape x
      //   _placeholders_re  = new RegExp "(?:#{placeholder_esc})+", 'gv'
      //   @assign { _placeholders_re, }
      //   return true

        // #---------------------------------------------------------------------------------------------------------
      // @incremental_text: ( x, { placeholder = null }={} ) ->
      //   return false unless @T.text.isa x
      //   @assign { chrs: ( freeze Array.from x ), }
      //   return _test_monotony.call @, x, '<', { placeholder, }

        //---------------------------------------------------------------------------------------------------------
      static incremental_text(x) {
        if (!this.T.text.isa(x)) {
          return false;
        }
        this.assign({
          chrs: freeze(Array.from(x))
        });
        return _test_monotony.call(this, x, '<');
      }

      //---------------------------------------------------------------------------------------------------------
      static decremental_text(x) {
        if (!this.T.text.isa(x)) {
          return false;
        }
        this.assign({
          chrs: freeze(Array.from(x))
        });
        return _test_monotony.call(this, x, '>');
      }

      //---------------------------------------------------------------------------------------------------------
      static nmag_bare_reversed(x) {
        return this.T.incremental_text.dm_isa(this.data, null, x);
      }

      // #---------------------------------------------------------------------------------------------------------
      // @pmag_bare: ( x, { placeholder = null }={} ) ->
      //   return @T.incremental_text.dm_isa @data, null, x, { placeholder, }

        //---------------------------------------------------------------------------------------------------------
      static pmag_bare(x) {
        return this.T.incremental_text.dm_isa(this.data, null, x);
      }

      //---------------------------------------------------------------------------------------------------------
      // @magnifiers: ( x, { cardinals_only = false, _placeholders_re = null }={} ) ->
      static magnifiers(x, {cardinals_only = false} = {}) {
        var _nmag, _nmag_list, _pmag, _pmag_list, nmag_bare_reversed, parts, pmag_bare, ref;
        if (!this.T.nonempty_text.isa(x)) {
          return this.fail("expected a magnifier, got an empty text");
        }
        parts = x.split(this[CFG].blank_splitter);
        if (cardinals_only) {
          if ((ref = parts.length) !== 1 && ref !== 2) {
            return this.fail(`magnifiers for { cardinals_only: true } must have 0 or 1 blank, got ${parts.length - 1} blanks`);
          }
        } else {
          if (parts.length !== 2) {
            return this.fail(`magnifiers for { cardinals_only: false } must have exactly 1 blank, got ${parts.length - 1} blanks`);
          }
        }
        if (parts.length === 1) {
          [nmag_bare_reversed, pmag_bare] = [null, ...parts];
        } else {
          [nmag_bare_reversed, pmag_bare] = parts;
        }
        //.......................................................................................................
        if (cardinals_only) {
          if (!this.T.pmag_bare.dm_isa(this.data, {
            chrs: '_pmag_list'
          }, pmag_bare)) { // , { _placeholders_re, }
            return this.fail("Ωbsk___3 ???");
          }
          _nmag = null;
          _pmag = this[CFG].blank + pmag_bare;
          _nmag_list = null;
          _pmag_list = freeze(Array.from(_pmag));
        } else {
          if (!this.T.nmag_bare_reversed.dm_isa(this.data, {
            chrs: 'nmag_chrs_reversed'
          }, nmag_bare_reversed)) {
            //.......................................................................................................
            return this.fail("Ωbsk___6 ???");
          }
          if (!this.T.pmag_bare.dm_isa(this.data, {
            chrs: '_pmag_list'
          }, pmag_bare)) { // , { _placeholders_re, }
            return this.fail("Ωbsk___7 ???");
          }
          if (!this.T.incremental_text.isa(nmag_bare_reversed + pmag_bare)) { // , { _placeholders_re, }
            return this.fail("Ωbsk___8 ???");
          }
          if (nmag_bare_reversed.length !== pmag_bare.length) {
            return this.fail("Ωbsk___9 ???");
          }
          _nmag = this[CFG].blank + [...this.data.nmag_chrs_reversed].reverse().join('');
          _pmag = this[CFG].blank + pmag_bare;
          _nmag_list = freeze(Array.from(_nmag));
          _pmag_list = freeze(Array.from(_pmag));
        }
        //.......................................................................................................
        this.assign({_nmag, _pmag, _nmag_list, _pmag_list});
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      static digitset(x) {
        var _base, _leading_novas_re, _naught, _nova;
        if (!this.T.incremental_text.dm_isa(this.data, {
          chrs: '_digits_list'
        }, x)) {
          return false;
        }
        _base = this.data._digits_list.length;
        if (!this.T._base.isa(_base)) {
          return this.fail("an digitset must have 2 chrs or more");
        }
        _naught = this.data._digits_list.at(0);
        _nova = this.data._digits_list.at(-1);
        _leading_novas_re = internals.get_leading_novas_re(_nova);
        this.assign({_base, _naught, _nova, _leading_novas_re});
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      static uniliterals(x, {cardinals_only = false} = {}) {
        var _cipher, _nuns, _nuns_list, _puns, _zpuns, _zpuns_list, parts, ref;
        if (!this.T.nonempty_text.isa(x)) {
          return false;
        }
        if (this.T.character.isa(x)) {
          _nuns = null;
          _zpuns = x;
          _cipher = x;
          _nuns_list = freeze([]); // null !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
          _zpuns_list = freeze([x]);
          this.assign({_nuns, _zpuns, _nuns_list, _zpuns_list, _cipher});
          return true;
        }
        //.......................................................................................................
        parts = x.split(this[CFG].blank_splitter);
        //.......................................................................................................
        if (cardinals_only) {
          if ((ref = parts.length) !== 2 && ref !== 3) {
            return this.fail(`uniliterals for { cardinals_only: true } that are not a single character must have 1 or 2 blanks, got ${parts.length - 1} blanks`);
          }
        } else {
          if (parts.length !== 3) {
            return this.fail(`uniliterals for { cardinals_only: false } that are not a single character must have exactly 2 blanks, got ${parts.length - 1} blanks`);
          }
        }
        //.......................................................................................................
        if (parts.length === 2) {
          [_nuns, _cipher, _puns] = [null, ...parts];
        } else {
          [_nuns, _cipher, _puns] = parts;
          if (cardinals_only) {
            _nuns = null;
          }
        }
        //.......................................................................................................
        _zpuns = _cipher + _puns;
        this.assign({_nuns, _zpuns, _cipher});
        //.......................................................................................................
        if (cardinals_only) {
          this.assign({
            _nuns_list: null
          });
        } else {
          if (!this.T.incremental_text.dm_isa(this.data, {
            chrs: '_nuns_list'
          }, _nuns)) {
            return false;
          }
        }
        if (!this.T.incremental_text.dm_isa(this.data, {
          chrs: '_zpuns_list'
        }, _zpuns)) {
          //.......................................................................................................
          return false;
        }
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      static _alphabet(x) {
        if (!this.T.nonempty_text.dm_isa(this.data, null, x)) {
          return false;
        }
        if (!this.T.incremental_text.dm_isa(this.data, null, x)) {
          return false;
        }
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      static _max_integer(x, _base) {
        if (!this.T.pinteger.isa(x)) {
          return this.fail("x not a positive safe integer");
        }
        if (!this.T._base.isa(_base)) {
          return this.fail("_base not a safe integer greater than 1");
        }
        if (!is_positive_all_niner(x, _base)) {
          return this.fail("x not a positive all-niners");
        }
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      static idx_or_vdx(x) {
        switch (true) {
          case this.T.integer.isa(x):
            this.assign({
              type: 'idx'
            });
            return true;
          case this.T.list.isa(x):
            this.assign({
              type: 'vdx'
            });
            return true;
        }
        return this.fail("not a list or an integer");
      }

      //---------------------------------------------------------------------------------------------------------
      static idx(x, _min_integer = null, _max_integer = null) {
        if (!this.T.integer.isa(x)) {
          return this.fail(`${rpr(x)} not a safe integer`);
        }
        if ((_min_integer != null) && !(x >= _min_integer)) {
          return this.fail(`${rpr(x)} not greater or equal ${_min_integer}`);
        }
        if ((_max_integer != null) && !(x <= _max_integer)) {
          return this.fail(`${rpr(x)} not less or equal ${_min_integer}`);
        }
        return true;
      }

      //---------------------------------------------------------------------------------------------------------
      static vdx(x) {
        return this.T.list.isa(x); // and ( x.length > 0 )
      }

      
        //---------------------------------------------------------------------------------------------------------
      /* TAINT should be method of `T._max_integer` */
      create_max_integer({_base, digits_per_idx}) {
        var R;
        this._base.validate(_base);
        this.digits_per_idx.validate(digits_per_idx);
        R = Math.min(get_max_integer(Number.MAX_SAFE_INTEGER, _base), (_base ** digits_per_idx) - 1);
        this._max_integer.validate(R, _base);
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      static digits_per_idx(x, _pmag_list = null) {
        if (!this.T.pinteger.isa(x)) {
          return this.fail(`${x} not a positive safe integer`);
        }
        if ((_pmag_list != null) && !(x <= _pmag_list.length)) {
          return this.fail(`${x} exceeds limit ${_pmag_list.length} set by magnifiers`);
        }
        return true;
      }

    };

    //=========================================================================================================
    Hollerith_typespace[CFG] = {
      blank: ' '
    };

    return Hollerith_typespace;

  }).call(this);

  //===========================================================================================================
  // _test_monotony = ( x, cmp, { placeholder = null }={} ) ->
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
            throw new Error(`Ωbsk__10 (internal) expected '>' or '<', got ${rpr(cmp)}`);
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
    Hollerith_typespace,
    CFG: CFG,
    internals
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxHQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLHFCQUFBLEVBQUEsNEJBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUE7OztFQUdBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLHFCQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFNBREYsRUFFRSxHQUZGLENBQUEsR0FFNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxpQkFBbkIsQ0FBQSxDQUY1QixFQVRBOzs7Ozs7O0VBWUEsQ0FBQSxDQUFFLDRCQUFGLEVBQ0UscUJBREYsRUFFRSxlQUZGLENBQUEsR0FRNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBUjVCLEVBWkE7OztFQXdCQSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLElBQUYsRUFBUSxTQUFSLENBQWQsRUFHVixDQUFBOztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBRSxLQUFGLENBQUE7YUFBYSxDQUFFLEtBQUEs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LEVBQUE7SUFBRSxDQUFBLENBQUUsSUFBRixDQUFBLEdBQVksSUFBQyxDQUFBLElBQWIsRUFBRjtJQUNFLElBQTZDLElBQUksQ0FBQyxNQUFMLEtBQWUsQ0FBNUQ7QUFBQSxhQUFTLElBQUMsQ0FBQSxJQUFELENBQU0sd0JBQU4sRUFBVDs7SUFDQSxJQUE2QyxJQUFJLENBQUMsTUFBTCxLQUFlLENBQTVEO0FBQUEsYUFBTyxLQUFQOztJQUNBLEtBQVcsMEZBQVg7TUFDRSxPQUFBLEdBQVUsSUFBSSxDQUFFLEdBQUEsR0FBTSxDQUFSO01BQ2QsR0FBQSxHQUFVLElBQUksQ0FBRSxHQUFGO01BQ2QsQ0FBQTtBQUFVLGdCQUFPLEdBQVA7QUFBQSxlQUNILEdBREc7bUJBQ00sT0FBQSxHQUFVO0FBRGhCLGVBRUgsR0FGRzttQkFFTSxPQUFBLEdBQVU7QUFGaEI7WUFHSCxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksR0FBSixDQUFoRCxDQUFBLENBQVY7QUFISDs7TUFJVixJQUFZLENBQVo7QUFBQSxpQkFBQTs7TUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRO1FBQUUsSUFBQSxFQUFNLENBQUUsQ0FBRixFQUFLLEdBQUwsRUFBVSxPQUFWLEVBQW1CLEdBQW5CO01BQVIsQ0FBUjtBQUNBLGFBQU87SUFUVDtBQVVBLFdBQU87RUFkUSxFQTFQakI7OztFQTJRQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QjtJQUM1QixtQkFENEI7SUFFNUIsR0FBQSxFQUFzQixHQUZNO0lBRzVCO0VBSDRCLENBQTlCO0FBM1FBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNmbW9kdWxlcydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IHJlZ2V4LCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAncmVnZXgnXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG57IFR5cGUsXG4gIFR5cGVzcGFjZSxcbiAgQ0ZHLCAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9uYW5vdHlwZXMoKVxueyBpc19wb3NpdGl2ZV9pbnRlZ2VyX3Bvd2VyX29mLFxuICBpc19wb3NpdGl2ZV9hbGxfbmluZXIsXG4gIGdldF9tYXhfaW50ZWdlcixcbiAgIyBnZXRfbWF4X25pbmVyX2RpZ2l0X2NvdW50LFxuICAjIGVuY29kZSxcbiAgIyBkZWNvZGUsXG4gICMgbG9nX3RvX2Jhc2UsXG4gICMgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9hbnliYXNlKClcblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmludGVybmFscyA9IE9iamVjdC5hc3NpZ24geyBUeXBlLCBUeXBlc3BhY2UsIH0sXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBnZXRfbGVhZGluZ19ub3Zhc19yZTogKCBfbm92YSApIC0+ICggcmVnZXggJ2cnIClcIlwiXCIgXiAje19ub3ZhfSogKD89IC4rICQgKSBcIlwiXCJcblxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyBIT0xMRVJJVEggVFlQRVNQQUNFXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aF90eXBlc3BhY2UgZXh0ZW5kcyBUeXBlc3BhY2VcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgc3VwZXIgY2ZnXG4gICAgQGJsYW5rLnZhbGlkYXRlIEBbQ0ZHXS5ibGFua1xuICAgIGJsYW5rX2VzYyAgICAgICA9IFJlZ0V4cC5lc2NhcGUgQFtDRkddLmJsYW5rXG4gICAgYmxhbmtfc3BsaXR0ZXIgID0gbmV3IFJlZ0V4cCBcIig/OiN7YmxhbmtfZXNjfSkrXCIsICdndidcbiAgICBAW0NGR10gICAgICAgICAgPSBmcmVlemUgeyBAW0NGR10uLi4sIGJsYW5rX3NwbGl0dGVyLCB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAW0NGR106XG4gICAgYmxhbms6ICcgJ1xuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQGJvb2xlYW46ICAgICAgICAgKCB4ICkgLT4gKCB4IGlzIGZhbHNlICkgb3IgKCB4IGlzIHRydWUgKVxuICBAbGlzdDogICAgICAgICAgICAoIHggKSAtPiAoIHR5cGVfb2YgeCApIGlzICdsaXN0J1xuICBAdGV4dDogICAgICAgICAgICAoIHggKSAtPiAoIHR5cGVfb2YgeCApIGlzICd0ZXh0J1xuICBAbm9uZW1wdHlfdGV4dDogICAoIHggKSAtPiAoIEBULnRleHQuaXNhIHggKSBhbmQgKCB4Lmxlbmd0aCA+IDAgKVxuICBAY2hhcmFjdGVyOiAgICAgICAoIHggKSAtPiAoIEBULnRleHQuaXNhIHggKSBhbmQgKCAvXi4kL3YudGVzdCB4IClcbiAgQGZsb2F0OiAgICAgICAgICAgKCB4ICkgLT4gTnVtYmVyLmlzRmluaXRlIHhcbiAgQGludGVnZXI6ICAgICAgICAgKCB4ICkgLT4gTnVtYmVyLmlzU2FmZUludGVnZXIgeFxuICBAcGludGVnZXI6ICAgICAgICAoIHggKSAtPiAoIEBULmludGVnZXIuaXNhIHggKSBhbmQgKCB4ID4gIDAgKVxuICBAenBpbnRlZ2VyOiAgICAgICAoIHggKSAtPiAoIEBULmludGVnZXIuaXNhIHggKSBhbmQgKCB4ID49IDAgKVxuICBAY2FyZGluYWw6ICAgICAgICAoIHggKSAtPiBAVC56cGludGVnZXIuaXNhIHhcbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAaG9sbGVyaXRoOiAgICAgICAoIHggKSAtPiB4IGluc3RhbmNlb2YgKCByZXF1aXJlICcuL21haW4nICkuSG9sbGVyaXRoXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIE5PVEUgcmVxdWlyaW5nIGB4YCB0byBiZSBib3RoIGEgY2hhcmFjdGVyIGFuZCBlcXVhbCB0byBgQFtDRkddLmJsYW5rYCBtZWFucyBgQFtDRkddLmJsYW5rYCBpdHNlbGYgY2FuIGJlIHRlc3RlZCAjIyNcbiAgQGJsYW5rOiAgICAgICAgICAgKCB4ICkgLT4gKCBAVC5jaGFyYWN0ZXIuaXNhIHggKSBhbmQgKCB4IGlzIEBbQ0ZHXS5ibGFuayApXG4gIEBkaW1lbnNpb246ICAgICAgICggeCApIC0+ICggQFQucGludGVnZXIuaXNhICB4IClcbiAgQGNhcmRpbmFsc19vbmx5OiAgKCB4ICkgLT4gKCBAVC5ib29sZWFuLmlzYSAgIHggKVxuICBAX2Jhc2U6ICAgICAgICAgICAoIHggKSAtPiAoIEBULnBpbnRlZ2VyLmlzYSAgeCApIGFuZCAoIHggPiAxIClcbiAgIyBAZGlnaXRzX3Blcl9pZHg6ICAoIHggKSAtPiAoIEBULnBpbnRlZ2VyLmlzYSB4ICkgYW5kICggeCA+IDEgKVxuXG4gICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIEBwbGFjZWhvbGRlcjogKCB4ICkgLT5cbiAgIyAgIHJldHVybiBmYWxzZSB1bmxlc3MgKCBAVC5jaGFyYWN0ZXIuaXNhIHggKVxuICAjICAgcGxhY2Vob2xkZXJfZXNjICAgPSBSZWdFeHAuZXNjYXBlIHhcbiAgIyAgIF9wbGFjZWhvbGRlcnNfcmUgID0gbmV3IFJlZ0V4cCBcIig/OiN7cGxhY2Vob2xkZXJfZXNjfSkrXCIsICdndidcbiAgIyAgIEBhc3NpZ24geyBfcGxhY2Vob2xkZXJzX3JlLCB9XG4gICMgICByZXR1cm4gdHJ1ZVxuXG4gICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIEBpbmNyZW1lbnRhbF90ZXh0OiAoIHgsIHsgcGxhY2Vob2xkZXIgPSBudWxsIH09e30gKSAtPlxuICAjICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICMgICBAYXNzaWduIHsgY2hyczogKCBmcmVlemUgQXJyYXkuZnJvbSB4ICksIH1cbiAgIyAgIHJldHVybiBfdGVzdF9tb25vdG9ueS5jYWxsIEAsIHgsICc8JywgeyBwbGFjZWhvbGRlciwgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGluY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgQGFzc2lnbiB7IGNocnM6ICggZnJlZXplIEFycmF5LmZyb20geCApLCB9XG4gICAgcmV0dXJuIF90ZXN0X21vbm90b255LmNhbGwgQCwgeCwgJzwnXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGVjcmVtZW50YWxfdGV4dDogKCB4ICkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULnRleHQuaXNhIHhcbiAgICBAYXNzaWduIHsgY2hyczogKCBmcmVlemUgQXJyYXkuZnJvbSB4ICksIH1cbiAgICByZXR1cm4gX3Rlc3RfbW9ub3RvbnkuY2FsbCBALCB4LCAnPidcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBubWFnX2JhcmVfcmV2ZXJzZWQ6ICAoIHggKSAtPiBAVC5pbmNyZW1lbnRhbF90ZXh0LmRtX2lzYSBAZGF0YSwgbnVsbCwgeFxuXG4gICMgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIEBwbWFnX2JhcmU6ICggeCwgeyBwbGFjZWhvbGRlciA9IG51bGwgfT17fSApIC0+XG4gICMgICByZXR1cm4gQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIG51bGwsIHgsIHsgcGxhY2Vob2xkZXIsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBwbWFnX2JhcmU6ICggeCApIC0+XG4gICAgcmV0dXJuIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCBudWxsLCB4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAjIEBtYWduaWZpZXJzOiAoIHgsIHsgY2FyZGluYWxzX29ubHkgPSBmYWxzZSwgX3BsYWNlaG9sZGVyc19yZSA9IG51bGwgfT17fSApIC0+XG4gIEBtYWduaWZpZXJzOiAoIHgsIHsgY2FyZGluYWxzX29ubHkgPSBmYWxzZSwgfT17fSApIC0+XG4gICAgcmV0dXJuICggQGZhaWwgXCJleHBlY3RlZCBhIG1hZ25pZmllciwgZ290IGFuIGVtcHR5IHRleHRcIiApIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmlzYSB4XG4gICAgcGFydHMgPSB4LnNwbGl0IEBbQ0ZHXS5ibGFua19zcGxpdHRlclxuICAgIGlmIGNhcmRpbmFsc19vbmx5XG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGluIFsgMSwgMiwgXVxuICAgICAgICByZXR1cm4gKCBAZmFpbCBcIm1hZ25pZmllcnMgZm9yIHsgY2FyZGluYWxzX29ubHk6IHRydWUgfSBtdXN0IGhhdmUgMCBvciAxIGJsYW5rLCBnb3QgI3twYXJ0cy5sZW5ndGggLSAxfSBibGFua3NcIilcbiAgICBlbHNlXG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGlzIDJcbiAgICAgICAgcmV0dXJuICggQGZhaWwgXCJtYWduaWZpZXJzIGZvciB7IGNhcmRpbmFsc19vbmx5OiBmYWxzZSB9IG11c3QgaGF2ZSBleGFjdGx5IDEgYmxhbmssIGdvdCAje3BhcnRzLmxlbmd0aCAtIDF9IGJsYW5rc1wiKVxuICAgIGlmIHBhcnRzLmxlbmd0aCBpcyAxXG4gICAgICBbIG5tYWdfYmFyZV9yZXZlcnNlZCxcbiAgICAgICAgcG1hZ19iYXJlLCAgICAgICAgICBdID0gWyBudWxsLCBwYXJ0cy4uLiwgXVxuICAgIGVsc2VcbiAgICAgIFsgbm1hZ19iYXJlX3JldmVyc2VkLFxuICAgICAgICBwbWFnX2JhcmUsICAgICAgICAgIF0gPSBwYXJ0c1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgY2FyZGluYWxzX29ubHlcbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX18zID8/P1wiICkgdW5sZXNzICBAVC5wbWFnX2JhcmUuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdfcG1hZ19saXN0JywgfSwgcG1hZ19iYXJlICMgLCB7IF9wbGFjZWhvbGRlcnNfcmUsIH1cbiAgICAgIF9ubWFnICAgICAgID0gbnVsbFxuICAgICAgX3BtYWcgICAgICAgPSBAW0NGR10uYmxhbmsgKyBwbWFnX2JhcmVcbiAgICAgIF9ubWFnX2xpc3QgID0gbnVsbFxuICAgICAgX3BtYWdfbGlzdCAgPSBmcmVlemUgQXJyYXkuZnJvbSBfcG1hZ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZWxzZVxuICAgICAgcmV0dXJuICggQGZhaWwgXCLOqWJza19fXzYgPz8/XCIgKSB1bmxlc3MgIEBULm5tYWdfYmFyZV9yZXZlcnNlZC5kbV9pc2EgQGRhdGEsIHsgY2hyczogJ25tYWdfY2hyc19yZXZlcnNlZCcsIH0sICBubWFnX2JhcmVfcmV2ZXJzZWRcbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX183ID8/P1wiICkgdW5sZXNzICBAVC5wbWFnX2JhcmUuZG1faXNhICAgICAgICAgIEBkYXRhLCB7IGNocnM6ICdfcG1hZ19saXN0JywgfSwgICAgICAgICAgcG1hZ19iYXJlICMgLCB7IF9wbGFjZWhvbGRlcnNfcmUsIH1cbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX184ID8/P1wiICkgdW5sZXNzICBAVC5pbmNyZW1lbnRhbF90ZXh0LmlzYSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm1hZ19iYXJlX3JldmVyc2VkICsgcG1hZ19iYXJlICMgLCB7IF9wbGFjZWhvbGRlcnNfcmUsIH1cbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX185ID8/P1wiICkgdW5sZXNzICBubWFnX2JhcmVfcmV2ZXJzZWQubGVuZ3RoIGlzIHBtYWdfYmFyZS5sZW5ndGhcbiAgICAgIF9ubWFnICAgICAgID0gQFtDRkddLmJsYW5rICsgWyBAZGF0YS5ubWFnX2NocnNfcmV2ZXJzZWQuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJydcbiAgICAgIF9wbWFnICAgICAgID0gQFtDRkddLmJsYW5rICsgcG1hZ19iYXJlXG4gICAgICBfbm1hZ19saXN0ICA9IGZyZWV6ZSBBcnJheS5mcm9tIF9ubWFnXG4gICAgICBfcG1hZ19saXN0ICA9IGZyZWV6ZSBBcnJheS5mcm9tIF9wbWFnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAYXNzaWduIHsgX25tYWcsIF9wbWFnLCBfbm1hZ19saXN0LCBfcG1hZ19saXN0LCB9XG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBkaWdpdHNldDogKCB4ICkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdfZGlnaXRzX2xpc3QnLCB9LCB4XG4gICAgX2Jhc2UgICAgICAgICAgICAgPSBAZGF0YS5fZGlnaXRzX2xpc3QubGVuZ3RoXG4gICAgcmV0dXJuIEBmYWlsIFwiYW4gZGlnaXRzZXQgbXVzdCBoYXZlIDIgY2hycyBvciBtb3JlXCIgdW5sZXNzIEBULl9iYXNlLmlzYSBfYmFzZVxuICAgIF9uYXVnaHQgICAgICAgICAgID0gQGRhdGEuX2RpZ2l0c19saXN0LmF0ICAwXG4gICAgX25vdmEgICAgICAgICAgICAgPSBAZGF0YS5fZGlnaXRzX2xpc3QuYXQgLTFcbiAgICBfbGVhZGluZ19ub3Zhc19yZSA9IGludGVybmFscy5nZXRfbGVhZGluZ19ub3Zhc19yZSBfbm92YVxuICAgIEBhc3NpZ24geyBfYmFzZSwgX25hdWdodCwgX25vdmEsIF9sZWFkaW5nX25vdmFzX3JlLCB9XG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEB1bmlsaXRlcmFsczogKCB4LCB7IGNhcmRpbmFsc19vbmx5ID0gZmFsc2UsIH09e30gKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQubm9uZW1wdHlfdGV4dC5pc2EgeFxuICAgIGlmIEBULmNoYXJhY3Rlci5pc2EgeFxuICAgICAgX251bnMgICAgICAgPSBudWxsXG4gICAgICBfenB1bnMgICAgICA9IHhcbiAgICAgIF9jaXBoZXIgICAgID0geFxuICAgICAgX251bnNfbGlzdCAgPSBmcmVlemUgW10gIyBudWxsICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISFcbiAgICAgIF96cHVuc19saXN0ID0gZnJlZXplIFsgeCwgXVxuICAgICAgQGFzc2lnbiB7IF9udW5zLCBfenB1bnMsIF9udW5zX2xpc3QsIF96cHVuc19saXN0LCBfY2lwaGVyLCB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcGFydHMgPSB4LnNwbGl0IEBbQ0ZHXS5ibGFua19zcGxpdHRlclxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgY2FyZGluYWxzX29ubHlcbiAgICAgIHVubGVzcyBwYXJ0cy5sZW5ndGggaW4gWyAyLCAzLCBdXG4gICAgICAgIHJldHVybiBAZmFpbCBcInVuaWxpdGVyYWxzIGZvciB7IGNhcmRpbmFsc19vbmx5OiB0cnVlIH0gdGhhdCBhcmUgbm90IGEgc2luZ2xlIGNoYXJhY3RlciBtdXN0IGhhdmUgMSBvciAyIGJsYW5rcywgZ290ICN7cGFydHMubGVuZ3RoIC0gMX0gYmxhbmtzXCJcbiAgICBlbHNlXG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGlzIDNcbiAgICAgICAgcmV0dXJuIEBmYWlsIFwidW5pbGl0ZXJhbHMgZm9yIHsgY2FyZGluYWxzX29ubHk6IGZhbHNlIH0gdGhhdCBhcmUgbm90IGEgc2luZ2xlIGNoYXJhY3RlciBtdXN0IGhhdmUgZXhhY3RseSAyIGJsYW5rcywgZ290ICN7cGFydHMubGVuZ3RoIC0gMX0gYmxhbmtzXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIHBhcnRzLmxlbmd0aCBpcyAyXG4gICAgICBbIF9udW5zLFxuICAgICAgICBfY2lwaGVyLFxuICAgICAgICBfcHVucywgIF0gPSBbIG51bGwsIHBhcnRzLi4uLCBdXG4gICAgZWxzZVxuICAgICAgWyBfbnVucyxcbiAgICAgICAgX2NpcGhlcixcbiAgICAgICAgX3B1bnMsICBdID0gcGFydHNcbiAgICAgIF9udW5zICAgICAgID0gbnVsbCBpZiBjYXJkaW5hbHNfb25seVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgX3pwdW5zID0gX2NpcGhlciArIF9wdW5zXG4gICAgQGFzc2lnbiB7IF9udW5zLCBfenB1bnMsIF9jaXBoZXIsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGNhcmRpbmFsc19vbmx5XG4gICAgICBAYXNzaWduIHsgX251bnNfbGlzdDogbnVsbCwgfVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIHsgY2hyczogJ19udW5zX2xpc3QnLCB9LCAgX251bnNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIHsgY2hyczogJ196cHVuc19saXN0JywgfSwgX3pwdW5zXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBfYWxwaGFiZXQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmRtX2lzYSAgICBAZGF0YSwgbnVsbCwgeFxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIG51bGwsIHhcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQF9tYXhfaW50ZWdlcjogKCB4LCBfYmFzZSApIC0+XG4gICAgcmV0dXJuIEBmYWlsIFwieCBub3QgYSBwb3NpdGl2ZSBzYWZlIGludGVnZXJcIiAgICAgICAgICAgIHVubGVzcyBAVC5waW50ZWdlci5pc2EgICAgICAgIHhcbiAgICByZXR1cm4gQGZhaWwgXCJfYmFzZSBub3QgYSBzYWZlIGludGVnZXIgZ3JlYXRlciB0aGFuIDFcIiAgdW5sZXNzIEBULl9iYXNlLmlzYSAgICAgICAgICAgIF9iYXNlXG4gICAgcmV0dXJuIEBmYWlsIFwieCBub3QgYSBwb3NpdGl2ZSBhbGwtbmluZXJzXCIgICAgICAgICAgICAgIHVubGVzcyBpc19wb3NpdGl2ZV9hbGxfbmluZXIgIHgsIF9iYXNlXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBpZHhfb3JfdmR4OiAoIHggKSAtPlxuICAgIHN3aXRjaCB0cnVlXG4gICAgICB3aGVuIEBULmludGVnZXIuaXNhIHhcbiAgICAgICAgQGFzc2lnbiB7IHR5cGU6ICdpZHgnIH1cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIHdoZW4gQFQubGlzdC5pc2EgeFxuICAgICAgICBAYXNzaWduIHsgdHlwZTogJ3ZkeCcgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBAZmFpbCBcIm5vdCBhIGxpc3Qgb3IgYW4gaW50ZWdlclwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAaWR4OiAoIHgsIF9taW5faW50ZWdlciA9IG51bGwsIF9tYXhfaW50ZWdlciA9IG51bGwgKSAtPlxuICAgIHJldHVybiBAZmFpbCBcIiN7cnByIHh9IG5vdCBhIHNhZmUgaW50ZWdlclwiICAgICAgICAgICAgICAgICAgICB1bmxlc3MgQFQuaW50ZWdlci5pc2EgeFxuICAgIHJldHVybiBAZmFpbCBcIiN7cnByIHh9IG5vdCBncmVhdGVyIG9yIGVxdWFsICN7X21pbl9pbnRlZ2VyfVwiICBpZiBfbWluX2ludGVnZXI/IGFuZCBub3QgKCB4ID49IF9taW5faW50ZWdlciApXG4gICAgcmV0dXJuIEBmYWlsIFwiI3tycHIgeH0gbm90IGxlc3Mgb3IgZXF1YWwgI3tfbWluX2ludGVnZXJ9XCIgICAgIGlmIF9tYXhfaW50ZWdlcj8gYW5kIG5vdCAoIHggPD0gX21heF9pbnRlZ2VyIClcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZkeDogKCB4ICkgLT4gKCBAVC5saXN0LmlzYSB4ICkgIyBhbmQgKCB4Lmxlbmd0aCA+IDAgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIFRBSU5UIHNob3VsZCBiZSBtZXRob2Qgb2YgYFQuX21heF9pbnRlZ2VyYCAjIyNcbiAgY3JlYXRlX21heF9pbnRlZ2VyOiAoeyBfYmFzZSwgZGlnaXRzX3Blcl9pZHgsIH0pIC0+XG4gICAgQF9iYXNlLnZhbGlkYXRlICAgICAgICAgICBfYmFzZVxuICAgIEBkaWdpdHNfcGVyX2lkeC52YWxpZGF0ZSAgZGlnaXRzX3Blcl9pZHhcbiAgICBSID0gTWF0aC5taW4gKCBnZXRfbWF4X2ludGVnZXIgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIF9iYXNlICksICggKCBfYmFzZSAqKiBkaWdpdHNfcGVyX2lkeCApIC0gMSApXG4gICAgQF9tYXhfaW50ZWdlci52YWxpZGF0ZSBSLCBfYmFzZVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGlnaXRzX3Blcl9pZHg6ICggeCwgX3BtYWdfbGlzdCA9IG51bGwgKSAtPlxuICAgIHJldHVybiBAZmFpbCBcIiN7eH0gbm90IGEgcG9zaXRpdmUgc2FmZSBpbnRlZ2VyXCIgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmxlc3MgQFQucGludGVnZXIuaXNhIHhcbiAgICByZXR1cm4gQGZhaWwgXCIje3h9IGV4Y2VlZHMgbGltaXQgI3tfcG1hZ19saXN0Lmxlbmd0aH0gc2V0IGJ5IG1hZ25pZmllcnNcIiAgaWYgX3BtYWdfbGlzdD8gYW5kIG5vdCAoIHggPD0gX3BtYWdfbGlzdC5sZW5ndGggKVxuICAgIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyBfdGVzdF9tb25vdG9ueSA9ICggeCwgY21wLCB7IHBsYWNlaG9sZGVyID0gbnVsbCB9PXt9ICkgLT5cbl90ZXN0X21vbm90b255ID0gKCB4LCBjbXAgKSAtPlxuICB7IGNocnMsIH0gPSBAZGF0YSAjID0gQGNyZWF0ZSBkYXRhXG4gIHJldHVybiAoIEBmYWlsIFwiZW1wdHkgaXMgbm90IG1vbm90b25pY1wiICkgaWYgY2hycy5sZW5ndGggaXMgMFxuICByZXR1cm4gdHJ1ZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiBjaHJzLmxlbmd0aCBpcyAxXG4gIGZvciBpZHggaW4gWyAxIC4uLiBjaHJzLmxlbmd0aCBdXG4gICAgcHJ2X2NociA9IGNocnNbIGlkeCAtIDEgXSAjIDsgY29udGludWUgaWYgcGxhY2Vob2xkZXI/IGFuZCBwcnZfY2hyIGlzIHBsYWNlaG9sZGVyXG4gICAgY2hyICAgICA9IGNocnNbIGlkeCAgICAgXSAjIDsgY29udGludWUgaWYgcGxhY2Vob2xkZXI/IGFuZCAgICAgY2hyIGlzIHBsYWNlaG9sZGVyXG4gICAgUiAgICAgICA9IHN3aXRjaCBjbXBcbiAgICAgIHdoZW4gJz4nIHRoZW4gcHJ2X2NociA+IGNoclxuICAgICAgd2hlbiAnPCcgdGhlbiBwcnZfY2hyIDwgY2hyXG4gICAgICBlbHNlIHRocm93IG5ldyBFcnJvciBcIs6pYnNrX18xMCAoaW50ZXJuYWwpIGV4cGVjdGVkICc+JyBvciAnPCcsIGdvdCAje3JwciBjbXB9XCJcbiAgICBjb250aW51ZSBpZiBSXG4gICAgQGFzc2lnbiB7IGZhaWw6IHsgeCwgaWR4LCBwcnZfY2hyLCBjaHIsIH0sIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5PYmplY3QuYXNzaWduIG1vZHVsZS5leHBvcnRzLCB7XG4gIEhvbGxlcml0aF90eXBlc3BhY2UsXG4gIENGRzogICAgICAgICAgICAgICAgICBDRkcsXG4gIGludGVybmFscywgfVxuIl19
