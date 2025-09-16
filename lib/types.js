(function() {
  'use strict';
  var CFG, Hollerith_typespace, SFMODULES, Type, Typespace, _test_monotony, debug, freeze, get_max_integer, internals, is_positive_all_niner, is_positive_integer_power_of, regex, rpr, type_of;

  //===========================================================================================================
  SFMODULES = require('bricabrac-single-file-modules');

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxHQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLHFCQUFBLEVBQUEsNEJBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUE7OztFQUdBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFNBREYsRUFFRSxHQUZGLENBQUEsR0FFNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxpQkFBbkIsQ0FBQSxDQUY1QixFQVRBOzs7Ozs7O0VBWUEsQ0FBQSxDQUFFLDRCQUFGLEVBQ0UscUJBREYsRUFFRSxlQUZGLENBQUEsR0FRNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBUjVCLEVBWkE7OztFQXdCQSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLElBQUYsRUFBUSxTQUFSLENBQWQsRUFHVixDQUFBOztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBRSxLQUFGLENBQUE7YUFBYSxDQUFFLEtBQUEsQ0FBTSxHQUFOLENBQUYsQ0FBYSxDQUFBLEdBQUEsQ0FBQSxDQUFRLEtBQVIsQ0FBQSxhQUFBO0lBQTFCO0VBQXRCLENBSFU7O0VBVU47Ozs7SUFBTixNQUFBLG9CQUFBLFFBQWtDLFVBQWxDLENBQUE7O01BR0UsV0FBYSxDQUFFLEdBQUYsQ0FBQTtBQUNmLFlBQUEsU0FBQSxFQUFBO2FBQUksQ0FBTSxHQUFOO1FBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLElBQUMsQ0FBQyxHQUFELENBQUssQ0FBQyxLQUF2QjtRQUNBLFNBQUEsR0FBa0IsTUFBTSxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUMsR0FBRCxDQUFLLENBQUMsS0FBckI7UUFDbEIsY0FBQSxHQUFrQixJQUFJLE1BQUosQ0FBVyxDQUFBLEdBQUEsQ0FBQSxDQUFNLFNBQU4sQ0FBQSxFQUFBLENBQVgsRUFBZ0MsSUFBaEM7UUFDbEIsSUFBQyxDQUFDLEdBQUQsQ0FBRCxHQUFrQixNQUFBLENBQU8sQ0FBRSxHQUFBLElBQUMsQ0FBQyxHQUFELENBQUgsRUFBYSxjQUFiLENBQVA7QUFDbEIsZUFBTztNQU5JLENBRGY7OztNQWVvQixPQUFqQixPQUFpQixDQUFFLENBQUYsQ0FBQTtlQUFTLENBQUUsQ0FBQSxLQUFLLEtBQVAsQ0FBQSxJQUFrQixDQUFFLENBQUEsS0FBSyxJQUFQO01BQTNCOztNQUNBLE9BQWpCLElBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVMsQ0FBRSxPQUFBLENBQVEsQ0FBUixDQUFGLENBQUEsS0FBaUI7TUFBMUI7O01BQ0EsT0FBakIsSUFBaUIsQ0FBRSxDQUFGLENBQUE7ZUFBUyxDQUFFLE9BQUEsQ0FBUSxDQUFSLENBQUYsQ0FBQSxLQUFpQjtNQUExQjs7TUFDQSxPQUFqQixhQUFpQixDQUFFLENBQUYsQ0FBQTtlQUFTLENBQUUsSUFBQyxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBUixDQUFZLENBQVosQ0FBRixDQUFBLElBQXNCLENBQUUsQ0FBQyxDQUFDLE1BQUYsR0FBVyxDQUFiO01BQS9COztNQUNBLE9BQWpCLFNBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVMsQ0FBRSxJQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFSLENBQVksQ0FBWixDQUFGLENBQUEsSUFBc0IsQ0FBRSxNQUFNLENBQUMsSUFBUCxDQUFZLENBQVosQ0FBRjtNQUEvQjs7TUFDQSxPQUFqQixLQUFpQixDQUFFLENBQUYsQ0FBQTtlQUFTLE1BQU0sQ0FBQyxRQUFQLENBQWdCLENBQWhCO01BQVQ7O01BQ0EsT0FBakIsT0FBaUIsQ0FBRSxDQUFGLENBQUE7ZUFBUyxNQUFNLENBQUMsYUFBUCxDQUFxQixDQUFyQjtNQUFUOztNQUNBLE9BQWpCLFFBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVMsQ0FBRSxJQUFDLENBQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFYLENBQWUsQ0FBZixDQUFGLENBQUEsSUFBeUIsQ0FBRSxDQUFBLEdBQUssQ0FBUDtNQUFsQzs7TUFDQSxPQUFqQixTQUFpQixDQUFFLENBQUYsQ0FBQTtlQUFTLENBQUUsSUFBQyxDQUFBLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBWCxDQUFlLENBQWYsQ0FBRixDQUFBLElBQXlCLENBQUUsQ0FBQSxJQUFLLENBQVA7TUFBbEM7O01BQ0EsT0FBakIsUUFBaUIsQ0FBRSxDQUFGLENBQUE7ZUFBUyxJQUFDLENBQUEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFiLENBQWlCLENBQWpCO01BQVQsQ0F4QnBCOzs7TUEwQm9CLE9BQWpCLFNBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVMsQ0FBQSxZQUFhLENBQUUsT0FBQSxDQUFRLFFBQVIsQ0FBRixDQUFvQixDQUFDO01BQTNDLENBMUJwQjs7OztNQTZCb0IsT0FBakIsS0FBaUIsQ0FBRSxDQUFGLENBQUE7ZUFBUyxDQUFFLElBQUMsQ0FBQSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQWIsQ0FBaUIsQ0FBakIsQ0FBRixDQUFBLElBQTJCLENBQUUsQ0FBQSxLQUFLLElBQUMsQ0FBQyxHQUFELENBQUssQ0FBQyxLQUFkO01BQXBDOztNQUNBLE9BQWpCLFNBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVcsSUFBQyxDQUFBLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBWixDQUFpQixDQUFqQjtNQUFYOztNQUNBLE9BQWpCLGNBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVcsSUFBQyxDQUFBLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBWCxDQUFpQixDQUFqQjtNQUFYOztNQUNBLE9BQWpCLEtBQWlCLENBQUUsQ0FBRixDQUFBO2VBQVMsQ0FBRSxJQUFDLENBQUEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFaLENBQWlCLENBQWpCLENBQUYsQ0FBQSxJQUEyQixDQUFFLENBQUEsR0FBSSxDQUFOO01BQXBDLENBaENwQjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQWtEcUIsT0FBbEIsZ0JBQWtCLENBQUUsQ0FBRixDQUFBO1FBQ2pCLEtBQW9CLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQVIsQ0FBWSxDQUFaLENBQXBCO0FBQUEsaUJBQU8sTUFBUDs7UUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRO1VBQUUsSUFBQSxFQUFRLE1BQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLENBQVgsQ0FBUDtRQUFWLENBQVI7QUFDQSxlQUFPLGNBQWMsQ0FBQyxJQUFmLENBQW9CLElBQXBCLEVBQXVCLENBQXZCLEVBQTBCLEdBQTFCO01BSFUsQ0FsRHJCOzs7TUF3RHFCLE9BQWxCLGdCQUFrQixDQUFFLENBQUYsQ0FBQTtRQUNqQixLQUFvQixJQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFSLENBQVksQ0FBWixDQUFwQjtBQUFBLGlCQUFPLE1BQVA7O1FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUTtVQUFFLElBQUEsRUFBUSxNQUFBLENBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUFYLENBQVA7UUFBVixDQUFSO0FBQ0EsZUFBTyxjQUFjLENBQUMsSUFBZixDQUFvQixJQUFwQixFQUF1QixDQUF2QixFQUEwQixHQUExQjtNQUhVLENBeERyQjs7O01BOER3QixPQUFyQixrQkFBcUIsQ0FBRSxDQUFGLENBQUE7ZUFBUyxJQUFDLENBQUEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQXBCLENBQTJCLElBQUMsQ0FBQSxJQUE1QixFQUFrQyxJQUFsQyxFQUF3QyxDQUF4QztNQUFULENBOUR4Qjs7Ozs7OztNQXFFYyxPQUFYLFNBQVcsQ0FBRSxDQUFGLENBQUE7QUFDVixlQUFPLElBQUMsQ0FBQSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsTUFBcEIsQ0FBMkIsSUFBQyxDQUFBLElBQTVCLEVBQWtDLElBQWxDLEVBQXdDLENBQXhDO01BREcsQ0FyRWQ7Ozs7TUEwRWUsT0FBWixVQUFZLENBQUUsQ0FBRixFQUFLLENBQUUsY0FBQSxHQUFpQixLQUFuQixJQUE0QixDQUFBLENBQWpDLENBQUE7QUFDZixZQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsS0FBQSxFQUFBLFVBQUEsRUFBQSxrQkFBQSxFQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUE7UUFBSSxLQUFrRSxJQUFDLENBQUEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxHQUFqQixDQUFxQixDQUFyQixDQUFsRTtBQUFBLGlCQUFTLElBQUMsQ0FBQSxJQUFELENBQU0seUNBQU4sRUFBVDs7UUFDQSxLQUFBLEdBQVEsQ0FBQyxDQUFDLEtBQUYsQ0FBUSxJQUFDLENBQUMsR0FBRCxDQUFLLENBQUMsY0FBZjtRQUNSLElBQUcsY0FBSDtVQUNFLFdBQU8sS0FBSyxDQUFDLFlBQVksS0FBbEIsUUFBcUIsQ0FBNUI7QUFDRSxtQkFBUyxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsb0VBQUEsQ0FBQSxDQUF1RSxLQUFLLENBQUMsTUFBTixHQUFlLENBQXRGLENBQUEsT0FBQSxDQUFOLEVBRFg7V0FERjtTQUFBLE1BQUE7VUFJRSxJQUFPLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQXZCO0FBQ0UsbUJBQVMsSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLHdFQUFBLENBQUEsQ0FBMkUsS0FBSyxDQUFDLE1BQU4sR0FBZSxDQUExRixDQUFBLE9BQUEsQ0FBTixFQURYO1dBSkY7O1FBTUEsSUFBRyxLQUFLLENBQUMsTUFBTixLQUFnQixDQUFuQjtVQUNFLENBQUUsa0JBQUYsRUFDRSxTQURGLENBQUEsR0FDMEIsQ0FBRSxJQUFGLEVBQVEsR0FBQSxLQUFSLEVBRjVCO1NBQUEsTUFBQTtVQUlFLENBQUUsa0JBQUYsRUFDRSxTQURGLENBQUEsR0FDMEIsTUFMNUI7U0FSSjs7UUFlSSxJQUFHLGNBQUg7VUFDRSxLQUF3QyxJQUFDLENBQUEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFiLENBQW9CLElBQUMsQ0FBQSxJQUFyQixFQUEyQjtZQUFFLElBQUEsRUFBTTtVQUFSLENBQTNCLEVBQW9ELFNBQXBELENBQXhDO0FBQUEsbUJBQVMsSUFBQyxDQUFBLElBQUQsQ0FBTSxjQUFOLEVBQVQ7O1VBQ0EsS0FBQSxHQUFjO1VBQ2QsS0FBQSxHQUFjLElBQUMsQ0FBQyxHQUFELENBQUssQ0FBQyxLQUFQLEdBQWU7VUFDN0IsVUFBQSxHQUFjO1VBQ2QsVUFBQSxHQUFjLE1BQUEsQ0FBTyxLQUFLLENBQUMsSUFBTixDQUFXLEtBQVgsQ0FBUCxFQUxoQjtTQUFBLE1BQUE7VUFRRSxLQUF3QyxJQUFDLENBQUEsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLE1BQXRCLENBQTZCLElBQUMsQ0FBQSxJQUE5QixFQUFvQztZQUFFLElBQUEsRUFBTTtVQUFSLENBQXBDLEVBQXNFLGtCQUF0RSxDQUF4Qzs7QUFBQSxtQkFBUyxJQUFDLENBQUEsSUFBRCxDQUFNLGNBQU4sRUFBVDs7VUFDQSxLQUF3QyxJQUFDLENBQUEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFiLENBQTZCLElBQUMsQ0FBQSxJQUE5QixFQUFvQztZQUFFLElBQUEsRUFBTTtVQUFSLENBQXBDLEVBQXNFLFNBQXRFLENBQXhDO0FBQUEsbUJBQVMsSUFBQyxDQUFBLElBQUQsQ0FBTSxjQUFOLEVBQVQ7O1VBQ0EsS0FBd0MsSUFBQyxDQUFBLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFwQixDQUFzRSxrQkFBQSxHQUFxQixTQUEzRixDQUF4QztBQUFBLG1CQUFTLElBQUMsQ0FBQSxJQUFELENBQU0sY0FBTixFQUFUOztVQUNBLElBQXdDLGtCQUFrQixDQUFDLE1BQW5CLEtBQTZCLFNBQVMsQ0FBQyxNQUEvRTtBQUFBLG1CQUFTLElBQUMsQ0FBQSxJQUFELENBQU0sY0FBTixFQUFUOztVQUNBLEtBQUEsR0FBYyxJQUFDLENBQUMsR0FBRCxDQUFLLENBQUMsS0FBUCxHQUFlLENBQUUsR0FBQSxJQUFDLENBQUEsSUFBSSxDQUFDLGtCQUFSLENBQWdDLENBQUMsT0FBakMsQ0FBQSxDQUEwQyxDQUFDLElBQTNDLENBQWdELEVBQWhEO1VBQzdCLEtBQUEsR0FBYyxJQUFDLENBQUMsR0FBRCxDQUFLLENBQUMsS0FBUCxHQUFlO1VBQzdCLFVBQUEsR0FBYyxNQUFBLENBQU8sS0FBSyxDQUFDLElBQU4sQ0FBVyxLQUFYLENBQVA7VUFDZCxVQUFBLEdBQWMsTUFBQSxDQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsS0FBWCxDQUFQLEVBZmhCO1NBZko7O1FBZ0NJLElBQUMsQ0FBQSxNQUFELENBQVEsQ0FBRSxLQUFGLEVBQVMsS0FBVCxFQUFnQixVQUFoQixFQUE0QixVQUE1QixDQUFSO0FBQ0EsZUFBTztNQWxDSSxDQTFFZjs7O01BK0dhLE9BQVYsUUFBVSxDQUFFLENBQUYsQ0FBQTtBQUNiLFlBQUEsS0FBQSxFQUFBLGlCQUFBLEVBQUEsT0FBQSxFQUFBO1FBQUksS0FBb0IsSUFBQyxDQUFBLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFwQixDQUEyQixJQUFDLENBQUEsSUFBNUIsRUFBa0M7VUFBRSxJQUFBLEVBQU07UUFBUixDQUFsQyxFQUE2RCxDQUE3RCxDQUFwQjtBQUFBLGlCQUFPLE1BQVA7O1FBQ0EsS0FBQSxHQUFvQixJQUFDLENBQUEsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUN2QyxLQUEyRCxJQUFDLENBQUEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFULENBQWEsS0FBYixDQUEzRDtBQUFBLGlCQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sc0NBQU4sRUFBUDs7UUFDQSxPQUFBLEdBQW9CLElBQUMsQ0FBQSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQW5CLENBQXVCLENBQXZCO1FBQ3BCLEtBQUEsR0FBb0IsSUFBQyxDQUFBLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBbkIsQ0FBc0IsQ0FBQyxDQUF2QjtRQUNwQixpQkFBQSxHQUFvQixTQUFTLENBQUMsb0JBQVYsQ0FBK0IsS0FBL0I7UUFDcEIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxDQUFFLEtBQUYsRUFBUyxPQUFULEVBQWtCLEtBQWxCLEVBQXlCLGlCQUF6QixDQUFSO0FBQ0EsZUFBTztNQVJFLENBL0diOzs7TUEwSGdCLE9BQWIsV0FBYSxDQUFFLENBQUYsRUFBSyxDQUFFLGNBQUEsR0FBaUIsS0FBbkIsSUFBNEIsQ0FBQSxDQUFqQyxDQUFBO0FBQ2hCLFlBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBO1FBQUksS0FBb0IsSUFBQyxDQUFBLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBakIsQ0FBcUIsQ0FBckIsQ0FBcEI7QUFBQSxpQkFBTyxNQUFQOztRQUNBLElBQUcsSUFBQyxDQUFBLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBYixDQUFpQixDQUFqQixDQUFIO1VBQ0UsS0FBQSxHQUFjO1VBQ2QsTUFBQSxHQUFjO1VBQ2QsT0FBQSxHQUFjO1VBQ2QsVUFBQSxHQUFjLE1BQUEsQ0FBTyxFQUFQLEVBSHBCO1VBSU0sV0FBQSxHQUFjLE1BQUEsQ0FBTyxDQUFFLENBQUYsQ0FBUDtVQUNkLElBQUMsQ0FBQSxNQUFELENBQVEsQ0FBRSxLQUFGLEVBQVMsTUFBVCxFQUFpQixVQUFqQixFQUE2QixXQUE3QixFQUEwQyxPQUExQyxDQUFSO0FBQ0EsaUJBQU8sS0FQVDtTQURKOztRQVVJLEtBQUEsR0FBUSxDQUFDLENBQUMsS0FBRixDQUFRLElBQUMsQ0FBQyxHQUFELENBQUssQ0FBQyxjQUFmLEVBVlo7O1FBWUksSUFBRyxjQUFIO1VBQ0UsV0FBTyxLQUFLLENBQUMsWUFBWSxLQUFsQixRQUFxQixDQUE1QjtBQUNFLG1CQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxzR0FBQSxDQUFBLENBQXlHLEtBQUssQ0FBQyxNQUFOLEdBQWUsQ0FBeEgsQ0FBQSxPQUFBLENBQU4sRUFEVDtXQURGO1NBQUEsTUFBQTtVQUlFLElBQU8sS0FBSyxDQUFDLE1BQU4sS0FBZ0IsQ0FBdkI7QUFDRSxtQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFNLENBQUEsMEdBQUEsQ0FBQSxDQUE2RyxLQUFLLENBQUMsTUFBTixHQUFlLENBQTVILENBQUEsT0FBQSxDQUFOLEVBRFQ7V0FKRjtTQVpKOztRQW1CSSxJQUFHLEtBQUssQ0FBQyxNQUFOLEtBQWdCLENBQW5CO1VBQ0UsQ0FBRSxLQUFGLEVBQ0UsT0FERixFQUVFLEtBRkYsQ0FBQSxHQUVjLENBQUUsSUFBRixFQUFRLEdBQUEsS0FBUixFQUhoQjtTQUFBLE1BQUE7VUFLRSxDQUFFLEtBQUYsRUFDRSxPQURGLEVBRUUsS0FGRixDQUFBLEdBRWM7VUFDZCxJQUFzQixjQUF0QjtZQUFBLEtBQUEsR0FBYyxLQUFkO1dBUkY7U0FuQko7O1FBNkJJLE1BQUEsR0FBUyxPQUFBLEdBQVU7UUFDbkIsSUFBQyxDQUFBLE1BQUQsQ0FBUSxDQUFFLEtBQUYsRUFBUyxNQUFULEVBQWlCLE9BQWpCLENBQVIsRUE5Qko7O1FBZ0NJLElBQUcsY0FBSDtVQUNFLElBQUMsQ0FBQSxNQUFELENBQVE7WUFBRSxVQUFBLEVBQVk7VUFBZCxDQUFSLEVBREY7U0FBQSxNQUFBO1VBR0UsS0FBb0IsSUFBQyxDQUFBLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFwQixDQUEyQixJQUFDLENBQUEsSUFBNUIsRUFBa0M7WUFBRSxJQUFBLEVBQU07VUFBUixDQUFsQyxFQUE0RCxLQUE1RCxDQUFwQjtBQUFBLG1CQUFPLE1BQVA7V0FIRjs7UUFLQSxLQUFvQixJQUFDLENBQUEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQXBCLENBQTJCLElBQUMsQ0FBQSxJQUE1QixFQUFrQztVQUFFLElBQUEsRUFBTTtRQUFSLENBQWxDLEVBQTRELE1BQTVELENBQXBCOztBQUFBLGlCQUFPLE1BQVA7O0FBQ0EsZUFBTztNQXZDSyxDQTFIaEI7OztNQW9LYyxPQUFYLFNBQVcsQ0FBRSxDQUFGLENBQUE7UUFDVixLQUFvQixJQUFDLENBQUEsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxNQUFqQixDQUEyQixJQUFDLENBQUEsSUFBNUIsRUFBa0MsSUFBbEMsRUFBd0MsQ0FBeEMsQ0FBcEI7QUFBQSxpQkFBTyxNQUFQOztRQUNBLEtBQW9CLElBQUMsQ0FBQSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsTUFBcEIsQ0FBMkIsSUFBQyxDQUFBLElBQTVCLEVBQWtDLElBQWxDLEVBQXdDLENBQXhDLENBQXBCO0FBQUEsaUJBQU8sTUFBUDs7QUFDQSxlQUFPO01BSEcsQ0FwS2Q7OztNQTBLaUIsT0FBZCxZQUFjLENBQUUsQ0FBRixFQUFLLEtBQUwsQ0FBQTtRQUNiLEtBQStELElBQUMsQ0FBQSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQVosQ0FBdUIsQ0FBdkIsQ0FBL0Q7QUFBQSxpQkFBTyxJQUFDLENBQUEsSUFBRCxDQUFNLCtCQUFOLEVBQVA7O1FBQ0EsS0FBK0QsSUFBQyxDQUFBLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBVCxDQUF3QixLQUF4QixDQUEvRDtBQUFBLGlCQUFPLElBQUMsQ0FBQSxJQUFELENBQU0seUNBQU4sRUFBUDs7UUFDQSxLQUErRCxxQkFBQSxDQUF1QixDQUF2QixFQUEwQixLQUExQixDQUEvRDtBQUFBLGlCQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sNkJBQU4sRUFBUDs7QUFDQSxlQUFPO01BSk0sQ0ExS2pCOzs7TUFpTGUsT0FBWixVQUFZLENBQUUsQ0FBRixDQUFBO0FBQ1gsZ0JBQU8sSUFBUDtBQUFBLGVBQ08sSUFBQyxDQUFBLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBWCxDQUFlLENBQWYsQ0FEUDtZQUVJLElBQUMsQ0FBQSxNQUFELENBQVE7Y0FBRSxJQUFBLEVBQU07WUFBUixDQUFSO0FBQ0EsbUJBQU87QUFIWCxlQUlPLElBQUMsQ0FBQSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQVIsQ0FBWSxDQUFaLENBSlA7WUFLSSxJQUFDLENBQUEsTUFBRCxDQUFRO2NBQUUsSUFBQSxFQUFNO1lBQVIsQ0FBUjtBQUNBLG1CQUFPO0FBTlg7QUFPQSxlQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sMEJBQU47TUFSSSxDQWpMZjs7O01BNExRLE9BQUwsR0FBSyxDQUFFLENBQUYsRUFBSyxlQUFlLElBQXBCLEVBQTBCLGVBQWUsSUFBekMsQ0FBQTtRQUNKLEtBQXFFLElBQUMsQ0FBQSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQVgsQ0FBZSxDQUFmLENBQXJFO0FBQUEsaUJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLENBQUEsQ0FBRyxHQUFBLENBQUksQ0FBSixDQUFILENBQUEsbUJBQUEsQ0FBTixFQUFQOztRQUNBLElBQWlFLHNCQUFBLElBQWtCLENBQUksQ0FBRSxDQUFBLElBQUssWUFBUCxDQUF2RjtBQUFBLGlCQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sQ0FBQSxDQUFBLENBQUcsR0FBQSxDQUFJLENBQUosQ0FBSCxDQUFBLHNCQUFBLENBQUEsQ0FBaUMsWUFBakMsQ0FBQSxDQUFOLEVBQVA7O1FBQ0EsSUFBaUUsc0JBQUEsSUFBa0IsQ0FBSSxDQUFFLENBQUEsSUFBSyxZQUFQLENBQXZGO0FBQUEsaUJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLENBQUEsQ0FBRyxHQUFBLENBQUksQ0FBSixDQUFILENBQUEsbUJBQUEsQ0FBQSxDQUE4QixZQUE5QixDQUFBLENBQU4sRUFBUDs7QUFDQSxlQUFPO01BSkgsQ0E1TFI7OztNQW1NUSxPQUFMLEdBQUssQ0FBRSxDQUFGLENBQUE7ZUFBVyxJQUFDLENBQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFSLENBQVksQ0FBWixFQUFYO01BQUEsQ0FuTVI7Ozs7O01BdU1FLGtCQUFvQixDQUFDLENBQUUsS0FBRixFQUFTLGNBQVQsQ0FBRCxDQUFBO0FBQ3RCLFlBQUE7UUFBSSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVAsQ0FBMEIsS0FBMUI7UUFDQSxJQUFDLENBQUEsY0FBYyxDQUFDLFFBQWhCLENBQTBCLGNBQTFCO1FBQ0EsQ0FBQSxHQUFJLElBQUksQ0FBQyxHQUFMLENBQVcsZUFBQSxDQUFnQixNQUFNLENBQUMsZ0JBQXZCLEVBQXlDLEtBQXpDLENBQVgsRUFBK0QsQ0FBRSxLQUFBLElBQVMsY0FBWCxDQUFBLEdBQThCLENBQTdGO1FBQ0osSUFBQyxDQUFBLFlBQVksQ0FBQyxRQUFkLENBQXVCLENBQXZCLEVBQTBCLEtBQTFCO0FBQ0EsZUFBTztNQUxXLENBdk10Qjs7O01BK01tQixPQUFoQixjQUFnQixDQUFFLENBQUYsRUFBSyxhQUFhLElBQWxCLENBQUE7UUFDZixLQUFpRixJQUFDLENBQUEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFaLENBQWdCLENBQWhCLENBQWpGO0FBQUEsaUJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLENBQUEsQ0FBRyxDQUFILENBQUEsNEJBQUEsQ0FBTixFQUFQOztRQUNBLElBQTZFLG9CQUFBLElBQWdCLENBQUksQ0FBRSxDQUFBLElBQUssVUFBVSxDQUFDLE1BQWxCLENBQWpHO0FBQUEsaUJBQU8sSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFBLENBQUEsQ0FBRyxDQUFILENBQUEsZUFBQSxDQUFBLENBQXNCLFVBQVUsQ0FBQyxNQUFqQyxDQUFBLGtCQUFBLENBQU4sRUFBUDs7QUFDQSxlQUFPO01BSFE7O0lBak5uQjs7O0lBYUUsbUJBQUUsQ0FBQSxHQUFBLENBQUYsR0FDRTtNQUFBLEtBQUEsRUFBTztJQUFQOzs7O2dCQWhESjs7OztFQTBQQSxjQUFBLEdBQWlCLFFBQUEsQ0FBRSxDQUFGLEVBQUssR0FBTCxDQUFBO0FBQ2pCLFFBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUEsQ0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUE7SUFBRSxDQUFBLENBQUUsSUFBRixDQUFBLEdBQVksSUFBQyxDQUFBLElBQWIsRUFBRjtJQUNFLElBQTZDLElBQUksQ0FBQyxNQUFMLEtBQWUsQ0FBNUQ7QUFBQSxhQUFTLElBQUMsQ0FBQSxJQUFELENBQU0sd0JBQU4sRUFBVDs7SUFDQSxJQUE2QyxJQUFJLENBQUMsTUFBTCxLQUFlLENBQTVEO0FBQUEsYUFBTyxLQUFQOztJQUNBLEtBQVcsMEZBQVg7TUFDRSxPQUFBLEdBQVUsSUFBSSxDQUFFLEdBQUEsR0FBTSxDQUFSO01BQ2QsR0FBQSxHQUFVLElBQUksQ0FBRSxHQUFGO01BQ2QsQ0FBQTtBQUFVLGdCQUFPLEdBQVA7QUFBQSxlQUNILEdBREc7bUJBQ00sT0FBQSxHQUFVO0FBRGhCLGVBRUgsR0FGRzttQkFFTSxPQUFBLEdBQVU7QUFGaEI7WUFHSCxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsNkNBQUEsQ0FBQSxDQUFnRCxHQUFBLENBQUksR0FBSixDQUFoRCxDQUFBLENBQVY7QUFISDs7TUFJVixJQUFZLENBQVo7QUFBQSxpQkFBQTs7TUFDQSxJQUFDLENBQUEsTUFBRCxDQUFRO1FBQUUsSUFBQSxFQUFNLENBQUUsQ0FBRixFQUFLLEdBQUwsRUFBVSxPQUFWLEVBQW1CLEdBQW5CO01BQVIsQ0FBUjtBQUNBLGFBQU87SUFUVDtBQVVBLFdBQU87RUFkUSxFQTFQakI7OztFQTJRQSxNQUFNLENBQUMsTUFBUCxDQUFjLE1BQU0sQ0FBQyxPQUFyQixFQUE4QjtJQUM1QixtQkFENEI7SUFFNUIsR0FBQSxFQUFzQixHQUZNO0lBRzVCO0VBSDRCLENBQTlCO0FBM1FBIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBmcmVlemUsICAgICAgICAgICAgICAgfSA9IE9iamVjdFxueyBUeXBlLFxuICBUeXBlc3BhY2UsXG4gIENGRywgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfbmFub3R5cGVzKClcbnsgaXNfcG9zaXRpdmVfaW50ZWdlcl9wb3dlcl9vZixcbiAgaXNfcG9zaXRpdmVfYWxsX25pbmVyLFxuICBnZXRfbWF4X2ludGVnZXIsXG4gICMgZ2V0X21heF9uaW5lcl9kaWdpdF9jb3VudCxcbiAgIyBlbmNvZGUsXG4gICMgZGVjb2RlLFxuICAjIGxvZ190b19iYXNlLFxuICAjIGdldF9yZXF1aXJlZF9kaWdpdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5pbnRlcm5hbHMgPSBPYmplY3QuYXNzaWduIHsgVHlwZSwgVHlwZXNwYWNlLCB9LFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZ2V0X2xlYWRpbmdfbm92YXNfcmU6ICggX25vdmEgKSAtPiAoIHJlZ2V4ICdnJyApXCJcIlwiIF4gI3tfbm92YX0qICg/PSAuKyAkICkgXCJcIlwiXG5cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgSE9MTEVSSVRIIFRZUEVTUEFDRVxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhfdHlwZXNwYWNlIGV4dGVuZHMgVHlwZXNwYWNlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgIHN1cGVyIGNmZ1xuICAgIEBibGFuay52YWxpZGF0ZSBAW0NGR10uYmxhbmtcbiAgICBibGFua19lc2MgICAgICAgPSBSZWdFeHAuZXNjYXBlIEBbQ0ZHXS5ibGFua1xuICAgIGJsYW5rX3NwbGl0dGVyICA9IG5ldyBSZWdFeHAgXCIoPzoje2JsYW5rX2VzY30pK1wiLCAnZ3YnXG4gICAgQFtDRkddICAgICAgICAgID0gZnJlZXplIHsgQFtDRkddLi4uLCBibGFua19zcGxpdHRlciwgfVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQFtDRkddOlxuICAgIGJsYW5rOiAnICdcblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBib29sZWFuOiAgICAgICAgICggeCApIC0+ICggeCBpcyBmYWxzZSApIG9yICggeCBpcyB0cnVlIClcbiAgQGxpc3Q6ICAgICAgICAgICAgKCB4ICkgLT4gKCB0eXBlX29mIHggKSBpcyAnbGlzdCdcbiAgQHRleHQ6ICAgICAgICAgICAgKCB4ICkgLT4gKCB0eXBlX29mIHggKSBpcyAndGV4dCdcbiAgQG5vbmVtcHR5X3RleHQ6ICAgKCB4ICkgLT4gKCBAVC50ZXh0LmlzYSB4ICkgYW5kICggeC5sZW5ndGggPiAwIClcbiAgQGNoYXJhY3RlcjogICAgICAgKCB4ICkgLT4gKCBAVC50ZXh0LmlzYSB4ICkgYW5kICggL14uJC92LnRlc3QgeCApXG4gIEBmbG9hdDogICAgICAgICAgICggeCApIC0+IE51bWJlci5pc0Zpbml0ZSB4XG4gIEBpbnRlZ2VyOiAgICAgICAgICggeCApIC0+IE51bWJlci5pc1NhZmVJbnRlZ2VyIHhcbiAgQHBpbnRlZ2VyOiAgICAgICAgKCB4ICkgLT4gKCBAVC5pbnRlZ2VyLmlzYSB4ICkgYW5kICggeCA+ICAwIClcbiAgQHpwaW50ZWdlcjogICAgICAgKCB4ICkgLT4gKCBAVC5pbnRlZ2VyLmlzYSB4ICkgYW5kICggeCA+PSAwIClcbiAgQGNhcmRpbmFsOiAgICAgICAgKCB4ICkgLT4gQFQuenBpbnRlZ2VyLmlzYSB4XG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGhvbGxlcml0aDogICAgICAgKCB4ICkgLT4geCBpbnN0YW5jZW9mICggcmVxdWlyZSAnLi9tYWluJyApLkhvbGxlcml0aFxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBOT1RFIHJlcXVpcmluZyBgeGAgdG8gYmUgYm90aCBhIGNoYXJhY3RlciBhbmQgZXF1YWwgdG8gYEBbQ0ZHXS5ibGFua2AgbWVhbnMgYEBbQ0ZHXS5ibGFua2AgaXRzZWxmIGNhbiBiZSB0ZXN0ZWQgIyMjXG4gIEBibGFuazogICAgICAgICAgICggeCApIC0+ICggQFQuY2hhcmFjdGVyLmlzYSB4ICkgYW5kICggeCBpcyBAW0NGR10uYmxhbmsgKVxuICBAZGltZW5zaW9uOiAgICAgICAoIHggKSAtPiAoIEBULnBpbnRlZ2VyLmlzYSAgeCApXG4gIEBjYXJkaW5hbHNfb25seTogICggeCApIC0+ICggQFQuYm9vbGVhbi5pc2EgICB4IClcbiAgQF9iYXNlOiAgICAgICAgICAgKCB4ICkgLT4gKCBAVC5waW50ZWdlci5pc2EgIHggKSBhbmQgKCB4ID4gMSApXG4gICMgQGRpZ2l0c19wZXJfaWR4OiAgKCB4ICkgLT4gKCBAVC5waW50ZWdlci5pc2EgeCApIGFuZCAoIHggPiAxIClcblxuICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBAcGxhY2Vob2xkZXI6ICggeCApIC0+XG4gICMgICByZXR1cm4gZmFsc2UgdW5sZXNzICggQFQuY2hhcmFjdGVyLmlzYSB4IClcbiAgIyAgIHBsYWNlaG9sZGVyX2VzYyAgID0gUmVnRXhwLmVzY2FwZSB4XG4gICMgICBfcGxhY2Vob2xkZXJzX3JlICA9IG5ldyBSZWdFeHAgXCIoPzoje3BsYWNlaG9sZGVyX2VzY30pK1wiLCAnZ3YnXG4gICMgICBAYXNzaWduIHsgX3BsYWNlaG9sZGVyc19yZSwgfVxuICAjICAgcmV0dXJuIHRydWVcblxuICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBAaW5jcmVtZW50YWxfdGV4dDogKCB4LCB7IHBsYWNlaG9sZGVyID0gbnVsbCB9PXt9ICkgLT5cbiAgIyAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQudGV4dC5pc2EgeFxuICAjICAgQGFzc2lnbiB7IGNocnM6ICggZnJlZXplIEFycmF5LmZyb20geCApLCB9XG4gICMgICByZXR1cm4gX3Rlc3RfbW9ub3RvbnkuY2FsbCBALCB4LCAnPCcsIHsgcGxhY2Vob2xkZXIsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBpbmNyZW1lbnRhbF90ZXh0OiAoIHggKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQudGV4dC5pc2EgeFxuICAgIEBhc3NpZ24geyBjaHJzOiAoIGZyZWV6ZSBBcnJheS5mcm9tIHggKSwgfVxuICAgIHJldHVybiBfdGVzdF9tb25vdG9ueS5jYWxsIEAsIHgsICc8J1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRlY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgQGFzc2lnbiB7IGNocnM6ICggZnJlZXplIEFycmF5LmZyb20geCApLCB9XG4gICAgcmV0dXJuIF90ZXN0X21vbm90b255LmNhbGwgQCwgeCwgJz4nXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAbm1hZ19iYXJlX3JldmVyc2VkOiAgKCB4ICkgLT4gQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIG51bGwsIHhcblxuICAjICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBAcG1hZ19iYXJlOiAoIHgsIHsgcGxhY2Vob2xkZXIgPSBudWxsIH09e30gKSAtPlxuICAjICAgcmV0dXJuIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCBudWxsLCB4LCB7IHBsYWNlaG9sZGVyLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAcG1hZ19iYXJlOiAoIHggKSAtPlxuICAgIHJldHVybiBAVC5pbmNyZW1lbnRhbF90ZXh0LmRtX2lzYSBAZGF0YSwgbnVsbCwgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBAbWFnbmlmaWVyczogKCB4LCB7IGNhcmRpbmFsc19vbmx5ID0gZmFsc2UsIF9wbGFjZWhvbGRlcnNfcmUgPSBudWxsIH09e30gKSAtPlxuICBAbWFnbmlmaWVyczogKCB4LCB7IGNhcmRpbmFsc19vbmx5ID0gZmFsc2UsIH09e30gKSAtPlxuICAgIHJldHVybiAoIEBmYWlsIFwiZXhwZWN0ZWQgYSBtYWduaWZpZXIsIGdvdCBhbiBlbXB0eSB0ZXh0XCIgKSB1bmxlc3MgQFQubm9uZW1wdHlfdGV4dC5pc2EgeFxuICAgIHBhcnRzID0geC5zcGxpdCBAW0NGR10uYmxhbmtfc3BsaXR0ZXJcbiAgICBpZiBjYXJkaW5hbHNfb25seVxuICAgICAgdW5sZXNzIHBhcnRzLmxlbmd0aCBpbiBbIDEsIDIsIF1cbiAgICAgICAgcmV0dXJuICggQGZhaWwgXCJtYWduaWZpZXJzIGZvciB7IGNhcmRpbmFsc19vbmx5OiB0cnVlIH0gbXVzdCBoYXZlIDAgb3IgMSBibGFuaywgZ290ICN7cGFydHMubGVuZ3RoIC0gMX0gYmxhbmtzXCIpXG4gICAgZWxzZVxuICAgICAgdW5sZXNzIHBhcnRzLmxlbmd0aCBpcyAyXG4gICAgICAgIHJldHVybiAoIEBmYWlsIFwibWFnbmlmaWVycyBmb3IgeyBjYXJkaW5hbHNfb25seTogZmFsc2UgfSBtdXN0IGhhdmUgZXhhY3RseSAxIGJsYW5rLCBnb3QgI3twYXJ0cy5sZW5ndGggLSAxfSBibGFua3NcIilcbiAgICBpZiBwYXJ0cy5sZW5ndGggaXMgMVxuICAgICAgWyBubWFnX2JhcmVfcmV2ZXJzZWQsXG4gICAgICAgIHBtYWdfYmFyZSwgICAgICAgICAgXSA9IFsgbnVsbCwgcGFydHMuLi4sIF1cbiAgICBlbHNlXG4gICAgICBbIG5tYWdfYmFyZV9yZXZlcnNlZCxcbiAgICAgICAgcG1hZ19iYXJlLCAgICAgICAgICBdID0gcGFydHNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGNhcmRpbmFsc19vbmx5XG4gICAgICByZXR1cm4gKCBAZmFpbCBcIs6pYnNrX19fMyA/Pz9cIiApIHVubGVzcyAgQFQucG1hZ19iYXJlLmRtX2lzYSBAZGF0YSwgeyBjaHJzOiAnX3BtYWdfbGlzdCcsIH0sIHBtYWdfYmFyZSAjICwgeyBfcGxhY2Vob2xkZXJzX3JlLCB9XG4gICAgICBfbm1hZyAgICAgICA9IG51bGxcbiAgICAgIF9wbWFnICAgICAgID0gQFtDRkddLmJsYW5rICsgcG1hZ19iYXJlXG4gICAgICBfbm1hZ19saXN0ICA9IG51bGxcbiAgICAgIF9wbWFnX2xpc3QgID0gZnJlZXplIEFycmF5LmZyb20gX3BtYWdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGVsc2VcbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX182ID8/P1wiICkgdW5sZXNzICBAVC5ubWFnX2JhcmVfcmV2ZXJzZWQuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdubWFnX2NocnNfcmV2ZXJzZWQnLCB9LCAgbm1hZ19iYXJlX3JldmVyc2VkXG4gICAgICByZXR1cm4gKCBAZmFpbCBcIs6pYnNrX19fNyA/Pz9cIiApIHVubGVzcyAgQFQucG1hZ19iYXJlLmRtX2lzYSAgICAgICAgICBAZGF0YSwgeyBjaHJzOiAnX3BtYWdfbGlzdCcsIH0sICAgICAgICAgIHBtYWdfYmFyZSAjICwgeyBfcGxhY2Vob2xkZXJzX3JlLCB9XG4gICAgICByZXR1cm4gKCBAZmFpbCBcIs6pYnNrX19fOCA/Pz9cIiApIHVubGVzcyAgQFQuaW5jcmVtZW50YWxfdGV4dC5pc2EgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5tYWdfYmFyZV9yZXZlcnNlZCArIHBtYWdfYmFyZSAjICwgeyBfcGxhY2Vob2xkZXJzX3JlLCB9XG4gICAgICByZXR1cm4gKCBAZmFpbCBcIs6pYnNrX19fOSA/Pz9cIiApIHVubGVzcyAgbm1hZ19iYXJlX3JldmVyc2VkLmxlbmd0aCBpcyBwbWFnX2JhcmUubGVuZ3RoXG4gICAgICBfbm1hZyAgICAgICA9IEBbQ0ZHXS5ibGFuayArIFsgQGRhdGEubm1hZ19jaHJzX3JldmVyc2VkLi4uLCBdLnJldmVyc2UoKS5qb2luICcnXG4gICAgICBfcG1hZyAgICAgICA9IEBbQ0ZHXS5ibGFuayArIHBtYWdfYmFyZVxuICAgICAgX25tYWdfbGlzdCAgPSBmcmVlemUgQXJyYXkuZnJvbSBfbm1hZ1xuICAgICAgX3BtYWdfbGlzdCAgPSBmcmVlemUgQXJyYXkuZnJvbSBfcG1hZ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgQGFzc2lnbiB7IF9ubWFnLCBfcG1hZywgX25tYWdfbGlzdCwgX3BtYWdfbGlzdCwgfVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGlnaXRzZXQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC5pbmNyZW1lbnRhbF90ZXh0LmRtX2lzYSBAZGF0YSwgeyBjaHJzOiAnX2RpZ2l0c19saXN0JywgfSwgeFxuICAgIF9iYXNlICAgICAgICAgICAgID0gQGRhdGEuX2RpZ2l0c19saXN0Lmxlbmd0aFxuICAgIHJldHVybiBAZmFpbCBcImFuIGRpZ2l0c2V0IG11c3QgaGF2ZSAyIGNocnMgb3IgbW9yZVwiIHVubGVzcyBAVC5fYmFzZS5pc2EgX2Jhc2VcbiAgICBfbmF1Z2h0ICAgICAgICAgICA9IEBkYXRhLl9kaWdpdHNfbGlzdC5hdCAgMFxuICAgIF9ub3ZhICAgICAgICAgICAgID0gQGRhdGEuX2RpZ2l0c19saXN0LmF0IC0xXG4gICAgX2xlYWRpbmdfbm92YXNfcmUgPSBpbnRlcm5hbHMuZ2V0X2xlYWRpbmdfbm92YXNfcmUgX25vdmFcbiAgICBAYXNzaWduIHsgX2Jhc2UsIF9uYXVnaHQsIF9ub3ZhLCBfbGVhZGluZ19ub3Zhc19yZSwgfVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAdW5pbGl0ZXJhbHM6ICggeCwgeyBjYXJkaW5hbHNfb25seSA9IGZhbHNlLCB9PXt9ICkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULm5vbmVtcHR5X3RleHQuaXNhIHhcbiAgICBpZiBAVC5jaGFyYWN0ZXIuaXNhIHhcbiAgICAgIF9udW5zICAgICAgID0gbnVsbFxuICAgICAgX3pwdW5zICAgICAgPSB4XG4gICAgICBfY2lwaGVyICAgICA9IHhcbiAgICAgIF9udW5zX2xpc3QgID0gZnJlZXplIFtdICMgbnVsbCAhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhXG4gICAgICBfenB1bnNfbGlzdCA9IGZyZWV6ZSBbIHgsIF1cbiAgICAgIEBhc3NpZ24geyBfbnVucywgX3pwdW5zLCBfbnVuc19saXN0LCBfenB1bnNfbGlzdCwgX2NpcGhlciwgfVxuICAgICAgcmV0dXJuIHRydWVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHBhcnRzID0geC5zcGxpdCBAW0NGR10uYmxhbmtfc3BsaXR0ZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGNhcmRpbmFsc19vbmx5XG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGluIFsgMiwgMywgXVxuICAgICAgICByZXR1cm4gQGZhaWwgXCJ1bmlsaXRlcmFscyBmb3IgeyBjYXJkaW5hbHNfb25seTogdHJ1ZSB9IHRoYXQgYXJlIG5vdCBhIHNpbmdsZSBjaGFyYWN0ZXIgbXVzdCBoYXZlIDEgb3IgMiBibGFua3MsIGdvdCAje3BhcnRzLmxlbmd0aCAtIDF9IGJsYW5rc1wiXG4gICAgZWxzZVxuICAgICAgdW5sZXNzIHBhcnRzLmxlbmd0aCBpcyAzXG4gICAgICAgIHJldHVybiBAZmFpbCBcInVuaWxpdGVyYWxzIGZvciB7IGNhcmRpbmFsc19vbmx5OiBmYWxzZSB9IHRoYXQgYXJlIG5vdCBhIHNpbmdsZSBjaGFyYWN0ZXIgbXVzdCBoYXZlIGV4YWN0bHkgMiBibGFua3MsIGdvdCAje3BhcnRzLmxlbmd0aCAtIDF9IGJsYW5rc1wiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBwYXJ0cy5sZW5ndGggaXMgMlxuICAgICAgWyBfbnVucyxcbiAgICAgICAgX2NpcGhlcixcbiAgICAgICAgX3B1bnMsICBdID0gWyBudWxsLCBwYXJ0cy4uLiwgXVxuICAgIGVsc2VcbiAgICAgIFsgX251bnMsXG4gICAgICAgIF9jaXBoZXIsXG4gICAgICAgIF9wdW5zLCAgXSA9IHBhcnRzXG4gICAgICBfbnVucyAgICAgICA9IG51bGwgaWYgY2FyZGluYWxzX29ubHlcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIF96cHVucyA9IF9jaXBoZXIgKyBfcHVuc1xuICAgIEBhc3NpZ24geyBfbnVucywgX3pwdW5zLCBfY2lwaGVyLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBjYXJkaW5hbHNfb25seVxuICAgICAgQGFzc2lnbiB7IF9udW5zX2xpc3Q6IG51bGwsIH1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdfbnVuc19saXN0JywgfSwgIF9udW5zXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdfenB1bnNfbGlzdCcsIH0sIF96cHVuc1xuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAX2FscGhhYmV0OiAoIHggKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQubm9uZW1wdHlfdGV4dC5kbV9pc2EgICAgQGRhdGEsIG51bGwsIHhcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCBudWxsLCB4XG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBfbWF4X2ludGVnZXI6ICggeCwgX2Jhc2UgKSAtPlxuICAgIHJldHVybiBAZmFpbCBcInggbm90IGEgcG9zaXRpdmUgc2FmZSBpbnRlZ2VyXCIgICAgICAgICAgICB1bmxlc3MgQFQucGludGVnZXIuaXNhICAgICAgICB4XG4gICAgcmV0dXJuIEBmYWlsIFwiX2Jhc2Ugbm90IGEgc2FmZSBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAxXCIgIHVubGVzcyBAVC5fYmFzZS5pc2EgICAgICAgICAgICBfYmFzZVxuICAgIHJldHVybiBAZmFpbCBcInggbm90IGEgcG9zaXRpdmUgYWxsLW5pbmVyc1wiICAgICAgICAgICAgICB1bmxlc3MgaXNfcG9zaXRpdmVfYWxsX25pbmVyICB4LCBfYmFzZVxuICAgIHJldHVybiB0cnVlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAaWR4X29yX3ZkeDogKCB4ICkgLT5cbiAgICBzd2l0Y2ggdHJ1ZVxuICAgICAgd2hlbiBAVC5pbnRlZ2VyLmlzYSB4XG4gICAgICAgIEBhc3NpZ24geyB0eXBlOiAnaWR4JyB9XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB3aGVuIEBULmxpc3QuaXNhIHhcbiAgICAgICAgQGFzc2lnbiB7IHR5cGU6ICd2ZHgnIH1cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gQGZhaWwgXCJub3QgYSBsaXN0IG9yIGFuIGludGVnZXJcIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGlkeDogKCB4LCBfbWluX2ludGVnZXIgPSBudWxsLCBfbWF4X2ludGVnZXIgPSBudWxsICkgLT5cbiAgICByZXR1cm4gQGZhaWwgXCIje3JwciB4fSBub3QgYSBzYWZlIGludGVnZXJcIiAgICAgICAgICAgICAgICAgICAgdW5sZXNzIEBULmludGVnZXIuaXNhIHhcbiAgICByZXR1cm4gQGZhaWwgXCIje3JwciB4fSBub3QgZ3JlYXRlciBvciBlcXVhbCAje19taW5faW50ZWdlcn1cIiAgaWYgX21pbl9pbnRlZ2VyPyBhbmQgbm90ICggeCA+PSBfbWluX2ludGVnZXIgKVxuICAgIHJldHVybiBAZmFpbCBcIiN7cnByIHh9IG5vdCBsZXNzIG9yIGVxdWFsICN7X21pbl9pbnRlZ2VyfVwiICAgICBpZiBfbWF4X2ludGVnZXI/IGFuZCBub3QgKCB4IDw9IF9tYXhfaW50ZWdlciApXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEB2ZHg6ICggeCApIC0+ICggQFQubGlzdC5pc2EgeCApICMgYW5kICggeC5sZW5ndGggPiAwIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBUQUlOVCBzaG91bGQgYmUgbWV0aG9kIG9mIGBULl9tYXhfaW50ZWdlcmAgIyMjXG4gIGNyZWF0ZV9tYXhfaW50ZWdlcjogKHsgX2Jhc2UsIGRpZ2l0c19wZXJfaWR4LCB9KSAtPlxuICAgIEBfYmFzZS52YWxpZGF0ZSAgICAgICAgICAgX2Jhc2VcbiAgICBAZGlnaXRzX3Blcl9pZHgudmFsaWRhdGUgIGRpZ2l0c19wZXJfaWR4XG4gICAgUiA9IE1hdGgubWluICggZ2V0X21heF9pbnRlZ2VyIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLCBfYmFzZSApLCAoICggX2Jhc2UgKiogZGlnaXRzX3Blcl9pZHggKSAtIDEgKVxuICAgIEBfbWF4X2ludGVnZXIudmFsaWRhdGUgUiwgX2Jhc2VcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRpZ2l0c19wZXJfaWR4OiAoIHgsIF9wbWFnX2xpc3QgPSBudWxsICkgLT5cbiAgICByZXR1cm4gQGZhaWwgXCIje3h9IG5vdCBhIHBvc2l0aXZlIHNhZmUgaW50ZWdlclwiICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5sZXNzIEBULnBpbnRlZ2VyLmlzYSB4XG4gICAgcmV0dXJuIEBmYWlsIFwiI3t4fSBleGNlZWRzIGxpbWl0ICN7X3BtYWdfbGlzdC5sZW5ndGh9IHNldCBieSBtYWduaWZpZXJzXCIgIGlmIF9wbWFnX2xpc3Q/IGFuZCBub3QgKCB4IDw9IF9wbWFnX2xpc3QubGVuZ3RoIClcbiAgICByZXR1cm4gdHJ1ZVxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgX3Rlc3RfbW9ub3RvbnkgPSAoIHgsIGNtcCwgeyBwbGFjZWhvbGRlciA9IG51bGwgfT17fSApIC0+XG5fdGVzdF9tb25vdG9ueSA9ICggeCwgY21wICkgLT5cbiAgeyBjaHJzLCB9ID0gQGRhdGEgIyA9IEBjcmVhdGUgZGF0YVxuICByZXR1cm4gKCBAZmFpbCBcImVtcHR5IGlzIG5vdCBtb25vdG9uaWNcIiApIGlmIGNocnMubGVuZ3RoIGlzIDBcbiAgcmV0dXJuIHRydWUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgY2hycy5sZW5ndGggaXMgMVxuICBmb3IgaWR4IGluIFsgMSAuLi4gY2hycy5sZW5ndGggXVxuICAgIHBydl9jaHIgPSBjaHJzWyBpZHggLSAxIF0gIyA7IGNvbnRpbnVlIGlmIHBsYWNlaG9sZGVyPyBhbmQgcHJ2X2NociBpcyBwbGFjZWhvbGRlclxuICAgIGNociAgICAgPSBjaHJzWyBpZHggICAgIF0gIyA7IGNvbnRpbnVlIGlmIHBsYWNlaG9sZGVyPyBhbmQgICAgIGNociBpcyBwbGFjZWhvbGRlclxuICAgIFIgICAgICAgPSBzd2l0Y2ggY21wXG4gICAgICB3aGVuICc+JyB0aGVuIHBydl9jaHIgPiBjaHJcbiAgICAgIHdoZW4gJzwnIHRoZW4gcHJ2X2NociA8IGNoclxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJza19fMTAgKGludGVybmFsKSBleHBlY3RlZCAnPicgb3IgJzwnLCBnb3QgI3tycHIgY21wfVwiXG4gICAgY29udGludWUgaWYgUlxuICAgIEBhc3NpZ24geyBmYWlsOiB7IHgsIGlkeCwgcHJ2X2NociwgY2hyLCB9LCB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywge1xuICBIb2xsZXJpdGhfdHlwZXNwYWNlLFxuICBDRkc6ICAgICAgICAgICAgICAgICAgQ0ZHLFxuICBpbnRlcm5hbHMsIH1cbiJdfQ==
