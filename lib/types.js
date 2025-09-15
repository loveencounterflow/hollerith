(function() {
  'use strict';
  var CFG, Hollerith_typespace, SFMODULES, Type, Typespace, _test_monotony, debug, freeze, get_max_integer, internals, is_positive_all_niner, is_positive_integer_power_of, regex, rpr, type_of;

  //===========================================================================================================
  SFMODULES = require('../../bricabrac-single-file-modules');

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

      static pmag_bare(x) {
        return this.T.incremental_text.dm_isa(this.data, null, x);
      }

      //---------------------------------------------------------------------------------------------------------
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
          }, pmag_bare)) {
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
          }, pmag_bare)) {
            return this.fail("Ωbsk___7 ???");
          }
          if (!this.T.incremental_text.isa(nmag_bare_reversed + pmag_bare)) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3R5cGVzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQTtFQUFBO0FBQUEsTUFBQSxHQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBLFNBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsU0FBQSxFQUFBLHFCQUFBLEVBQUEsNEJBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUE7OztFQUdBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLHFDQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsQ0FBQSxHQUE0QixNQUE1Qjs7RUFDQSxDQUFBLENBQUUsSUFBRixFQUNFLFNBREYsRUFFRSxHQUZGLENBQUEsR0FFNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxpQkFBbkIsQ0FBQSxDQUY1QixFQVRBOzs7Ozs7O0VBWUEsQ0FBQSxDQUFFLDRCQUFGLEVBQ0UscUJBREYsRUFFRSxlQUZGLENBQUEsR0FRNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBUjVCLEVBWkE7OztFQXdCQSxTQUFBLEdBQVksTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFFLElBQUYsRUFBUSxTQUFSLENBQWQsRUFHVixDQUFBOztJQUFBLG9CQUFBLEVBQXNCLFFBQUEsQ0FBRSxLQUFGLENBQUE7YUFBYSxDQUFFLEtBQUEs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QVQ7O0lBQ0EsSUFBNkMsSUFBSSxDQUFDLE1BQUwsS0FBZSxDQUE1RDtBQUFBLGFBQU8sS0FBUDs7SUFDQSxLQUFXLDBGQUFYO01BQ0UsT0FBQSxHQUFVLElBQUksQ0FBRSxHQUFBLEdBQU0sQ0FBUjtNQUNkLEdBQUEsR0FBVSxJQUFJLENBQUUsR0FBRjtNQUNkLENBQUE7QUFBVSxnQkFBTyxHQUFQO0FBQUEsZUFDSCxHQURHO21CQUNNLE9BQUEsR0FBVTtBQURoQixlQUVILEdBRkc7bUJBRU0sT0FBQSxHQUFVO0FBRmhCO1lBR0gsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDZDQUFBLENBQUEsQ0FBZ0QsR0FBQSxDQUFJLEdBQUosQ0FBaEQsQ0FBQSxDQUFWO0FBSEg7O01BSVYsSUFBWSxDQUFaO0FBQUEsaUJBQUE7O01BQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBUTtRQUFFLElBQUEsRUFBTSxDQUFFLENBQUYsRUFBSyxHQUFMLEVBQVUsT0FBVixFQUFtQixHQUFuQjtNQUFSLENBQVI7QUFDQSxhQUFPO0lBVFQ7QUFVQSxXQUFPO0VBZFEsRUFqT2pCOzs7RUFrUEEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsT0FBckIsRUFBOEI7SUFDNUIsbUJBRDRCO0lBRTVCLEdBQUEsRUFBc0IsR0FGTTtJQUc1QjtFQUg0QixDQUE5QjtBQWxQQSIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4uLy4uL2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcbnsgVHlwZSxcbiAgVHlwZXNwYWNlLFxuICBDRkcsICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX25hbm90eXBlcygpXG57IGlzX3Bvc2l0aXZlX2ludGVnZXJfcG93ZXJfb2YsXG4gIGlzX3Bvc2l0aXZlX2FsbF9uaW5lcixcbiAgZ2V0X21heF9pbnRlZ2VyLFxuICAjIGdldF9tYXhfbmluZXJfZGlnaXRfY291bnQsXG4gICMgZW5jb2RlLFxuICAjIGRlY29kZSxcbiAgIyBsb2dfdG9fYmFzZSxcbiAgIyBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuaW50ZXJuYWxzID0gT2JqZWN0LmFzc2lnbiB7IFR5cGUsIFR5cGVzcGFjZSwgfSxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldF9sZWFkaW5nX25vdmFzX3JlOiAoIF9ub3ZhICkgLT4gKCByZWdleCAnZycgKVwiXCJcIiBeICN7X25vdmF9KiAoPz0gLisgJCApIFwiXCJcIlxuXG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIEhPTExFUklUSCBUWVBFU1BBQ0VcbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgSG9sbGVyaXRoX3R5cGVzcGFjZSBleHRlbmRzIFR5cGVzcGFjZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBzdXBlciBjZmdcbiAgICBAYmxhbmsudmFsaWRhdGUgQFtDRkddLmJsYW5rXG4gICAgYmxhbmtfZXNjICAgICAgID0gUmVnRXhwLmVzY2FwZSBAW0NGR10uYmxhbmtcbiAgICBibGFua19zcGxpdHRlciAgPSBuZXcgUmVnRXhwIFwiKD86I3tibGFua19lc2N9KStcIiwgJ2d2J1xuICAgIEBbQ0ZHXSAgICAgICAgICA9IGZyZWV6ZSB7IEBbQ0ZHXS4uLiwgYmxhbmtfc3BsaXR0ZXIsIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cblxuICAjPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIEBbQ0ZHXTpcbiAgICBibGFuazogJyAnXG5cbiAgIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICBAYm9vbGVhbjogICAgICAgICAoIHggKSAtPiAoIHggaXMgZmFsc2UgKSBvciAoIHggaXMgdHJ1ZSApXG4gIEBsaXN0OiAgICAgICAgICAgICggeCApIC0+ICggdHlwZV9vZiB4ICkgaXMgJ2xpc3QnXG4gIEB0ZXh0OiAgICAgICAgICAgICggeCApIC0+ICggdHlwZV9vZiB4ICkgaXMgJ3RleHQnXG4gIEBub25lbXB0eV90ZXh0OiAgICggeCApIC0+ICggQFQudGV4dC5pc2EgeCApIGFuZCAoIHgubGVuZ3RoID4gMCApXG4gIEBjaGFyYWN0ZXI6ICAgICAgICggeCApIC0+ICggQFQudGV4dC5pc2EgeCApIGFuZCAoIC9eLiQvdi50ZXN0IHggKVxuICBAZmxvYXQ6ICAgICAgICAgICAoIHggKSAtPiBOdW1iZXIuaXNGaW5pdGUgeFxuICBAaW50ZWdlcjogICAgICAgICAoIHggKSAtPiBOdW1iZXIuaXNTYWZlSW50ZWdlciB4XG4gIEBwaW50ZWdlcjogICAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCAoIHggPiAgMCApXG4gIEB6cGludGVnZXI6ICAgICAgICggeCApIC0+ICggQFQuaW50ZWdlci5pc2EgeCApIGFuZCAoIHggPj0gMCApXG4gIEBjYXJkaW5hbDogICAgICAgICggeCApIC0+IEBULnpwaW50ZWdlci5pc2EgeFxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMjIyBOT1RFIHJlcXVpcmluZyBgeGAgdG8gYmUgYm90aCBhIGNoYXJhY3RlciBhbmQgZXF1YWwgdG8gYEBbQ0ZHXS5ibGFua2AgbWVhbnMgYEBbQ0ZHXS5ibGFua2AgaXRzZWxmIGNhbiBiZSB0ZXN0ZWQgIyMjXG4gIEBibGFuazogICAgICAgICAgICggeCApIC0+ICggQFQuY2hhcmFjdGVyLmlzYSB4ICkgYW5kICggeCBpcyBAW0NGR10uYmxhbmsgKVxuICBAZGltZW5zaW9uOiAgICAgICAoIHggKSAtPiAoIEBULnBpbnRlZ2VyLmlzYSAgeCApXG4gIEBjYXJkaW5hbHNfb25seTogICggeCApIC0+ICggQFQuYm9vbGVhbi5pc2EgICB4IClcbiAgQF9iYXNlOiAgICAgICAgICAgKCB4ICkgLT4gKCBAVC5waW50ZWdlci5pc2EgIHggKSBhbmQgKCB4ID4gMSApXG4gICMgQGRpZ2l0c19wZXJfaWR4OiAgKCB4ICkgLT4gKCBAVC5waW50ZWdlci5pc2EgeCApIGFuZCAoIHggPiAxIClcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBpbmNyZW1lbnRhbF90ZXh0OiAoIHggKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQudGV4dC5pc2EgeFxuICAgIEBhc3NpZ24geyBjaHJzOiAoIGZyZWV6ZSBBcnJheS5mcm9tIHggKSwgfVxuICAgIHJldHVybiBfdGVzdF9tb25vdG9ueS5jYWxsIEAsIHgsICc8J1xuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRlY3JlbWVudGFsX3RleHQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC50ZXh0LmlzYSB4XG4gICAgQGFzc2lnbiB7IGNocnM6ICggZnJlZXplIEFycmF5LmZyb20geCApLCB9XG4gICAgcmV0dXJuIF90ZXN0X21vbm90b255LmNhbGwgQCwgeCwgJz4nXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAbm1hZ19iYXJlX3JldmVyc2VkOiAgKCB4ICkgLT4gQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIG51bGwsIHhcbiAgQHBtYWdfYmFyZTogICAgICAgICAgICggeCApIC0+IEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCBudWxsLCB4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAbWFnbmlmaWVyczogKCB4LCB7IGNhcmRpbmFsc19vbmx5ID0gZmFsc2UgfT17fSApIC0+XG4gICAgcmV0dXJuICggQGZhaWwgXCJleHBlY3RlZCBhIG1hZ25pZmllciwgZ290IGFuIGVtcHR5IHRleHRcIiApIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmlzYSB4XG4gICAgcGFydHMgPSB4LnNwbGl0IEBbQ0ZHXS5ibGFua19zcGxpdHRlclxuICAgIGlmIGNhcmRpbmFsc19vbmx5XG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGluIFsgMSwgMiwgXVxuICAgICAgICByZXR1cm4gKCBAZmFpbCBcIm1hZ25pZmllcnMgZm9yIHsgY2FyZGluYWxzX29ubHk6IHRydWUgfSBtdXN0IGhhdmUgMCBvciAxIGJsYW5rLCBnb3QgI3twYXJ0cy5sZW5ndGggLSAxfSBibGFua3NcIilcbiAgICBlbHNlXG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGlzIDJcbiAgICAgICAgcmV0dXJuICggQGZhaWwgXCJtYWduaWZpZXJzIGZvciB7IGNhcmRpbmFsc19vbmx5OiBmYWxzZSB9IG11c3QgaGF2ZSBleGFjdGx5IDEgYmxhbmssIGdvdCAje3BhcnRzLmxlbmd0aCAtIDF9IGJsYW5rc1wiKVxuICAgIGlmIHBhcnRzLmxlbmd0aCBpcyAxXG4gICAgICBbIG5tYWdfYmFyZV9yZXZlcnNlZCxcbiAgICAgICAgcG1hZ19iYXJlLCAgICAgICAgICBdID0gWyBudWxsLCBwYXJ0cy4uLiwgXVxuICAgIGVsc2VcbiAgICAgIFsgbm1hZ19iYXJlX3JldmVyc2VkLFxuICAgICAgICBwbWFnX2JhcmUsICAgICAgICAgIF0gPSBwYXJ0c1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgY2FyZGluYWxzX29ubHlcbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX18zID8/P1wiICkgdW5sZXNzICBAVC5wbWFnX2JhcmUuZG1faXNhICAgICAgICAgIEBkYXRhLCB7IGNocnM6ICdfcG1hZ19saXN0JywgfSwgICAgICAgICAgcG1hZ19iYXJlXG4gICAgICBfbm1hZyAgICAgICA9IG51bGxcbiAgICAgIF9wbWFnICAgICAgID0gQFtDRkddLmJsYW5rICsgcG1hZ19iYXJlXG4gICAgICBfbm1hZ19saXN0ICA9IG51bGxcbiAgICAgIF9wbWFnX2xpc3QgID0gZnJlZXplIEFycmF5LmZyb20gX3BtYWdcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGVsc2VcbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX182ID8/P1wiICkgdW5sZXNzICBAVC5ubWFnX2JhcmVfcmV2ZXJzZWQuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdubWFnX2NocnNfcmV2ZXJzZWQnLCB9LCAgbm1hZ19iYXJlX3JldmVyc2VkXG4gICAgICByZXR1cm4gKCBAZmFpbCBcIs6pYnNrX19fNyA/Pz9cIiApIHVubGVzcyAgQFQucG1hZ19iYXJlLmRtX2lzYSAgICAgICAgICBAZGF0YSwgeyBjaHJzOiAnX3BtYWdfbGlzdCcsIH0sICAgICAgICAgIHBtYWdfYmFyZVxuICAgICAgcmV0dXJuICggQGZhaWwgXCLOqWJza19fXzggPz8/XCIgKSB1bmxlc3MgIEBULmluY3JlbWVudGFsX3RleHQuaXNhICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBubWFnX2JhcmVfcmV2ZXJzZWQgKyBwbWFnX2JhcmVcbiAgICAgIHJldHVybiAoIEBmYWlsIFwizqlic2tfX185ID8/P1wiICkgdW5sZXNzICBubWFnX2JhcmVfcmV2ZXJzZWQubGVuZ3RoIGlzIHBtYWdfYmFyZS5sZW5ndGhcbiAgICAgIF9ubWFnICAgICAgID0gQFtDRkddLmJsYW5rICsgWyBAZGF0YS5ubWFnX2NocnNfcmV2ZXJzZWQuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJydcbiAgICAgIF9wbWFnICAgICAgID0gQFtDRkddLmJsYW5rICsgcG1hZ19iYXJlXG4gICAgICBfbm1hZ19saXN0ICA9IGZyZWV6ZSBBcnJheS5mcm9tIF9ubWFnXG4gICAgICBfcG1hZ19saXN0ICA9IGZyZWV6ZSBBcnJheS5mcm9tIF9wbWFnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBAYXNzaWduIHsgX25tYWcsIF9wbWFnLCBfbm1hZ19saXN0LCBfcG1hZ19saXN0LCB9XG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBkaWdpdHNldDogKCB4ICkgLT5cbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEBULmluY3JlbWVudGFsX3RleHQuZG1faXNhIEBkYXRhLCB7IGNocnM6ICdfZGlnaXRzX2xpc3QnLCB9LCB4XG4gICAgX2Jhc2UgICAgICAgICAgICAgPSBAZGF0YS5fZGlnaXRzX2xpc3QubGVuZ3RoXG4gICAgcmV0dXJuIEBmYWlsIFwiYW4gZGlnaXRzZXQgbXVzdCBoYXZlIDIgY2hycyBvciBtb3JlXCIgdW5sZXNzIEBULl9iYXNlLmlzYSBfYmFzZVxuICAgIF9uYXVnaHQgICAgICAgICAgID0gQGRhdGEuX2RpZ2l0c19saXN0LmF0ICAwXG4gICAgX25vdmEgICAgICAgICAgICAgPSBAZGF0YS5fZGlnaXRzX2xpc3QuYXQgLTFcbiAgICBfbGVhZGluZ19ub3Zhc19yZSA9IGludGVybmFscy5nZXRfbGVhZGluZ19ub3Zhc19yZSBfbm92YVxuICAgIEBhc3NpZ24geyBfYmFzZSwgX25hdWdodCwgX25vdmEsIF9sZWFkaW5nX25vdmFzX3JlLCB9XG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEB1bmlsaXRlcmFsczogKCB4LCB7IGNhcmRpbmFsc19vbmx5ID0gZmFsc2UsIH09e30gKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQubm9uZW1wdHlfdGV4dC5pc2EgeFxuICAgIGlmIEBULmNoYXJhY3Rlci5pc2EgeFxuICAgICAgX251bnMgICAgICAgPSBudWxsXG4gICAgICBfenB1bnMgICAgICA9IHhcbiAgICAgIF9jaXBoZXIgICAgID0geFxuICAgICAgX251bnNfbGlzdCAgPSBmcmVlemUgW10gIyBudWxsICEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISFcbiAgICAgIF96cHVuc19saXN0ID0gZnJlZXplIFsgeCwgXVxuICAgICAgQGFzc2lnbiB7IF9udW5zLCBfenB1bnMsIF9udW5zX2xpc3QsIF96cHVuc19saXN0LCBfY2lwaGVyLCB9XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcGFydHMgPSB4LnNwbGl0IEBbQ0ZHXS5ibGFua19zcGxpdHRlclxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgY2FyZGluYWxzX29ubHlcbiAgICAgIHVubGVzcyBwYXJ0cy5sZW5ndGggaW4gWyAyLCAzLCBdXG4gICAgICAgIHJldHVybiBAZmFpbCBcInVuaWxpdGVyYWxzIGZvciB7IGNhcmRpbmFsc19vbmx5OiB0cnVlIH0gdGhhdCBhcmUgbm90IGEgc2luZ2xlIGNoYXJhY3RlciBtdXN0IGhhdmUgMSBvciAyIGJsYW5rcywgZ290ICN7cGFydHMubGVuZ3RoIC0gMX0gYmxhbmtzXCJcbiAgICBlbHNlXG4gICAgICB1bmxlc3MgcGFydHMubGVuZ3RoIGlzIDNcbiAgICAgICAgcmV0dXJuIEBmYWlsIFwidW5pbGl0ZXJhbHMgZm9yIHsgY2FyZGluYWxzX29ubHk6IGZhbHNlIH0gdGhhdCBhcmUgbm90IGEgc2luZ2xlIGNoYXJhY3RlciBtdXN0IGhhdmUgZXhhY3RseSAyIGJsYW5rcywgZ290ICN7cGFydHMubGVuZ3RoIC0gMX0gYmxhbmtzXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIHBhcnRzLmxlbmd0aCBpcyAyXG4gICAgICBbIF9udW5zLFxuICAgICAgICBfY2lwaGVyLFxuICAgICAgICBfcHVucywgIF0gPSBbIG51bGwsIHBhcnRzLi4uLCBdXG4gICAgZWxzZVxuICAgICAgWyBfbnVucyxcbiAgICAgICAgX2NpcGhlcixcbiAgICAgICAgX3B1bnMsICBdID0gcGFydHNcbiAgICAgIF9udW5zICAgICAgID0gbnVsbCBpZiBjYXJkaW5hbHNfb25seVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgX3pwdW5zID0gX2NpcGhlciArIF9wdW5zXG4gICAgQGFzc2lnbiB7IF9udW5zLCBfenB1bnMsIF9jaXBoZXIsIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGNhcmRpbmFsc19vbmx5XG4gICAgICBAYXNzaWduIHsgX251bnNfbGlzdDogbnVsbCwgfVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIHsgY2hyczogJ19udW5zX2xpc3QnLCB9LCAgX251bnNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIHsgY2hyczogJ196cHVuc19saXN0JywgfSwgX3pwdW5zXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBfYWxwaGFiZXQ6ICggeCApIC0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAVC5ub25lbXB0eV90ZXh0LmRtX2lzYSAgICBAZGF0YSwgbnVsbCwgeFxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQFQuaW5jcmVtZW50YWxfdGV4dC5kbV9pc2EgQGRhdGEsIG51bGwsIHhcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQF9tYXhfaW50ZWdlcjogKCB4LCBfYmFzZSApIC0+XG4gICAgcmV0dXJuIEBmYWlsIFwieCBub3QgYSBwb3NpdGl2ZSBzYWZlIGludGVnZXJcIiAgICAgICAgICAgIHVubGVzcyBAVC5waW50ZWdlci5pc2EgICAgICAgIHhcbiAgICByZXR1cm4gQGZhaWwgXCJfYmFzZSBub3QgYSBzYWZlIGludGVnZXIgZ3JlYXRlciB0aGFuIDFcIiAgdW5sZXNzIEBULl9iYXNlLmlzYSAgICAgICAgICAgIF9iYXNlXG4gICAgcmV0dXJuIEBmYWlsIFwieCBub3QgYSBwb3NpdGl2ZSBhbGwtbmluZXJzXCIgICAgICAgICAgICAgIHVubGVzcyBpc19wb3NpdGl2ZV9hbGxfbmluZXIgIHgsIF9iYXNlXG4gICAgcmV0dXJuIHRydWVcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBpZHhfb3JfdmR4OiAoIHggKSAtPlxuICAgIHN3aXRjaCB0cnVlXG4gICAgICB3aGVuIEBULmludGVnZXIuaXNhIHhcbiAgICAgICAgQGFzc2lnbiB7IHR5cGU6ICdpZHgnIH1cbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIHdoZW4gQFQubGlzdC5pc2EgeFxuICAgICAgICBAYXNzaWduIHsgdHlwZTogJ3ZkeCcgfVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIHJldHVybiBAZmFpbCBcIm5vdCBhIGxpc3Qgb3IgYW4gaW50ZWdlclwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAaWR4OiAoIHgsIF9taW5faW50ZWdlciA9IG51bGwsIF9tYXhfaW50ZWdlciA9IG51bGwgKSAtPlxuICAgIHJldHVybiBAZmFpbCBcIiN7cnByIHh9IG5vdCBhIHNhZmUgaW50ZWdlclwiICAgICAgICAgICAgICAgICAgICB1bmxlc3MgQFQuaW50ZWdlci5pc2EgeFxuICAgIHJldHVybiBAZmFpbCBcIiN7cnByIHh9IG5vdCBncmVhdGVyIG9yIGVxdWFsICN7X21pbl9pbnRlZ2VyfVwiICBpZiBfbWluX2ludGVnZXI/IGFuZCBub3QgKCB4ID49IF9taW5faW50ZWdlciApXG4gICAgcmV0dXJuIEBmYWlsIFwiI3tycHIgeH0gbm90IGxlc3Mgb3IgZXF1YWwgI3tfbWluX2ludGVnZXJ9XCIgICAgIGlmIF9tYXhfaW50ZWdlcj8gYW5kIG5vdCAoIHggPD0gX21heF9pbnRlZ2VyIClcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZkeDogKCB4ICkgLT4gKCBAVC5saXN0LmlzYSB4ICkgIyBhbmQgKCB4Lmxlbmd0aCA+IDAgKVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyMjIFRBSU5UIHNob3VsZCBiZSBtZXRob2Qgb2YgYFQuX21heF9pbnRlZ2VyYCAjIyNcbiAgY3JlYXRlX21heF9pbnRlZ2VyOiAoeyBfYmFzZSwgZGlnaXRzX3Blcl9pZHgsIH0pIC0+XG4gICAgQF9iYXNlLnZhbGlkYXRlICAgICAgICAgICBfYmFzZVxuICAgIEBkaWdpdHNfcGVyX2lkeC52YWxpZGF0ZSAgZGlnaXRzX3Blcl9pZHhcbiAgICBSID0gTWF0aC5taW4gKCBnZXRfbWF4X2ludGVnZXIgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIsIF9iYXNlICksICggKCBfYmFzZSAqKiBkaWdpdHNfcGVyX2lkeCApIC0gMSApXG4gICAgQF9tYXhfaW50ZWdlci52YWxpZGF0ZSBSLCBfYmFzZVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAZGlnaXRzX3Blcl9pZHg6ICggeCwgX3BtYWdfbGlzdCA9IG51bGwgKSAtPlxuICAgIHJldHVybiBAZmFpbCBcIiN7eH0gbm90IGEgcG9zaXRpdmUgc2FmZSBpbnRlZ2VyXCIgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmxlc3MgQFQucGludGVnZXIuaXNhIHhcbiAgICByZXR1cm4gQGZhaWwgXCIje3h9IGV4Y2VlZHMgbGltaXQgI3tfcG1hZ19saXN0Lmxlbmd0aH0gc2V0IGJ5IG1hZ25pZmllcnNcIiAgaWYgX3BtYWdfbGlzdD8gYW5kIG5vdCAoIHggPD0gX3BtYWdfbGlzdC5sZW5ndGggKVxuICAgIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuX3Rlc3RfbW9ub3RvbnkgPSAoIHgsIGNtcCApIC0+XG4gIHsgY2hycywgfSA9IEBkYXRhICMgPSBAY3JlYXRlIGRhdGFcbiAgcmV0dXJuICggQGZhaWwgXCJlbXB0eSBpcyBub3QgbW9ub3RvbmljXCIgKSBpZiBjaHJzLmxlbmd0aCBpcyAwXG4gIHJldHVybiB0cnVlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIGNocnMubGVuZ3RoIGlzIDFcbiAgZm9yIGlkeCBpbiBbIDEgLi4uIGNocnMubGVuZ3RoIF1cbiAgICBwcnZfY2hyID0gY2hyc1sgaWR4IC0gMSBdXG4gICAgY2hyICAgICA9IGNocnNbIGlkeCAgICAgXVxuICAgIFIgICAgICAgPSBzd2l0Y2ggY21wXG4gICAgICB3aGVuICc+JyB0aGVuIHBydl9jaHIgPiBjaHJcbiAgICAgIHdoZW4gJzwnIHRoZW4gcHJ2X2NociA8IGNoclxuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IgXCLOqWJza19fMTAgKGludGVybmFsKSBleHBlY3RlZCAnPicgb3IgJzwnLCBnb3QgI3tycHIgY21wfVwiXG4gICAgY29udGludWUgaWYgUlxuICAgIEBhc3NpZ24geyBmYWlsOiB7IHgsIGlkeCwgcHJ2X2NociwgY2hyLCB9LCB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuT2JqZWN0LmFzc2lnbiBtb2R1bGUuZXhwb3J0cywge1xuICBIb2xsZXJpdGhfdHlwZXNwYWNlLFxuICBDRkc6ICAgICAgICAgICAgICAgICAgQ0ZHLFxuICBpbnRlcm5hbHMsIH1cbiJdfQ==
