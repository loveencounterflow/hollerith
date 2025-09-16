(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10_cardinal, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, hide, internals, log_to_base, regex, rpr, set_getter, test, type_of;

  //===========================================================================================================
  // { encodeBigInt,
  //   decodeBigInt,   } = TMP_require_encode_in_alphabet()
  SFMODULES = require('bricabrac-single-file-modules');

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({debug} = console);

  ({regex} = require('regex'));

  ({Grammar, Token, Lexeme} = require('interlex'));

  ({CFG, Hollerith_typespace} = require('./types'));

  ({clean_assign} = SFMODULES.unstable.require_clean_assign());

  ({encode, decode, log_to_base, get_required_digits, get_max_integer} = SFMODULES.unstable.require_anybase());

  ({freeze} = Object);

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

  test = require('./test-hollerith');

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    /*                           1         2         3       */
    /*                  12345678901234567890123456789012     */
    digitset: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_128_16383 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    /*                           1         2         3       */
    /*                  12345678901234567890123456789012     */
    digitset: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5,
    digits_per_idx: 2
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10 = freeze({
    uniliterals: 'ÏÐÑ ã äåæ',
    digitset: '0123456789',
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = freeze({
    uniliterals: 'N',
    digitset: '0123456789',
    magnifiers: 'JKLM OPQR',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    digitset: '0123456789',
    magnifiers: 'ABC XYZ',
    dimension: 3,
    digits_per_idx: 3
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10_cardinal = freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    digitset: '0123456789',
    magnifiers: 'ABC XYZ',
    cardinals_only: true, // nonegatives
    dimension: 3,
    digits_per_idx: 3
  });

  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = freeze({
    constants,
    constants_128,
    constants_128_16383,
    constants_10,
    constants_10mvp,
    constants_10mvp2,
    constants_10_cardinal,
    types: require('./types')
  });

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var clasz, types;
      clasz = this.constructor;
      ({cfg, types} = clasz.validate_and_compile_cfg(cfg));
      this.cfg = freeze(cfg);
      this.lexer = this.compile_sortkey_lexer(this.cfg);
      hide(this, 'types', types);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static validate_and_compile_cfg(cfg) {
      var R, hollerith_cfg_template, nmags, nuns, ref, types;
      hollerith_cfg_template = {
        // placeholder:    '\x00'
        blank: '\x20',
        dimension: 5,
        cardinals_only: false
      };
      //.......................................................................................................
      R = clean_assign({}, hollerith_cfg_template, cfg);
      types = new Hollerith_typespace({
        blank: R.blank
      });
      //.......................................................................................................
      // R.placeholder         = types.placeholder.validate R.placeholder
      // R._placeholders_re    = types.placeholder.data._placeholders_re
      //.......................................................................................................
      R.cardinals_only = types.cardinals_only.validate(R.cardinals_only);
      //.......................................................................................................
      R.digitset = types.digitset.validate(R.digitset);
      R._digits_list = types.digitset.data._digits_list;
      R._naught = types.digitset.data._naught;
      R._nova = types.digitset.data._nova;
      R._leading_novas_re = types.digitset.data._leading_novas_re;
      R._base = types.digitset.data._base;
      //.......................................................................................................
      // R.magnifiers          = types.magnifiers.validate R.magnifiers, { cardinals_only: R.cardinals_only, _placeholders_re: R._placeholders_re, }
      R.magnifiers = types.magnifiers.validate(R.magnifiers, {
        cardinals_only: R.cardinals_only
      });
      R._pmag_list = types.magnifiers.data._pmag_list;
      R._nmag_list = types.magnifiers.data._nmag_list;
      //.......................................................................................................
      R.uniliterals = types.uniliterals.validate(R.uniliterals, {
        cardinals_only: R.cardinals_only
      });
      R._cipher = types.uniliterals.data._cipher;
      R._nuns = types.uniliterals.data._nuns;
      R._zpuns = types.uniliterals.data._zpuns;
      R._nuns_list = types.uniliterals.data._nuns_list;
      R._zpuns_list = types.uniliterals.data._zpuns_list;
      //.......................................................................................................
      if (R._cipher !== R._zpuns_list[0]) {
        throw new Error(`Ωhll___1 internal error: _cipher ${rpr(R._cipher)} doesn't match _zpuns ${rpr(R._zpuns)}`);
      }
      R._min_nun = R._nuns_list != null ? -R._nuns_list.length : 0;
      R._max_zpun = R._zpuns_list.length - 1;
      R.dimension = types.dimension.validate(R.dimension);
      //.......................................................................................................
      if (R.digits_per_idx == null) {
        R.digits_per_idx = Math.min(R._pmag_list.length - 1, (ref = R.digits_per_idx) != null ? ref : 2e308);
      }
      R.digits_per_idx = types.digits_per_idx.validate(R.digits_per_idx, R._pmag_list);
      R._max_integer = types.create_max_integer({
        _base: R._base,
        digits_per_idx: R.digits_per_idx
      });
      //.......................................................................................................
      if (!R.cardinals_only) {
        if (R._nmag_list.length < R.digits_per_idx) {
          throw new Error(`Ωhll___2 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._nmag_list.length} positive magnifiers`);
        } else if (R._nmag_list.length > R.digits_per_idx) {
          R._nmag_list = freeze(R._nmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
        }
      }
      //.......................................................................................................
      if (R._pmag_list.length < R.digits_per_idx) {
        throw new Error(`Ωhll___3 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R.digits_per_idx) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R.cardinals_only ? null : R._nmag_list.join('');
      R._max_idx_width = R.digits_per_idx + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = R.cardinals_only ? 0 : -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      /* TAINT while treatment of NUNs, ZPUNs is unsatisfactory they're scheduled to be removed anyways so
             we refrain from improving that */
      nmags = R.cardinals_only ? '' : [...R._nmag_list].reverse().join('');
      nuns = R.cardinals_only ? '' : R._nuns;
      R._alphabet = R.digitset + nmags + (nuns != null ? nuns : '') + R._zpuns + R._pmag;
      R._alphabet = R._alphabet.replace(types[CFG].blank_splitter, '');
      // R._alphabet           = R._alphabet.replace R._placeholders_re,         ''
      R._alphabet = types._alphabet.validate(R._alphabet);
      return {
        cfg: R,
        types
      };
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, _nmag, _nuns, _pmag, _zpuns, all_zero_re, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, digitset, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, include_negatives, max_digit, nmag_letters, nuns_letters, pmag_letters, puns_letters, zero_letters;
      ({_nuns, _zpuns, _nmag, _pmag, digitset} = cfg);
      // _base              = digitset.length
      include_negatives = !cfg.cardinals_only;
      //.......................................................................................................
      puns_letters = _zpuns.slice(1);
      pmag_letters = _pmag.slice(1);
      zero_letters = _zpuns[0];
      max_digit = digitset.at(-1);
      //.......................................................................................................
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.......................................................................................................
      cast_pun = function({
          data: d
        }) {
        return d.index = +cfg._zpuns.indexOf(d.letters);
      };
      cast_pnum = function({
          data: d
        }) {
        return d.index = decode(d.mantissa, digitset);
      };
      cast_zero = function({
          data: d
        }) {
        return d.index = 0;
      };
      cast_padding = function({
          data: d,
          source,
          hit
        }) {
        if (source === hit) {
          return d.index = 0;
        }
      };
      cast_other = null;
      //.......................................................................................................
      if (include_negatives) {
        nuns_letters = _nuns;
        nmag_letters = _nmag.slice(1);
        fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
        fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
        cast_nun = function({
            data: d
          }) {
          return d.index = (cfg._nuns.indexOf(d.letters)) - cfg._nuns.length;
        };
        cast_nnum = function({
            data: d
          }) {
          var mantissa;
          mantissa = d.mantissa.padStart(cfg.digits_per_idx, max_digit);
          return d.index = (decode(mantissa, digitset)) - cfg._max_integer;
        };
      }
      //.......................................................................................................
      R = new Grammar({
        emit_signals: false
      });
      first = R.new_level({
        name: 'first'
      });
      if (include_negatives) {
        first.new_token({
          name: 'nun',
          fit: fit_nun,
          cast: cast_nun
        });
      }
      first.new_token({
        name: 'pun',
        fit: fit_pun,
        cast: cast_pun
      });
      if (include_negatives) {
        first.new_token({
          name: 'nnum',
          fit: fit_nnum,
          cast: cast_nnum
        });
      }
      first.new_token({
        name: 'pnum',
        fit: fit_pnum,
        cast: cast_pnum
      });
      first.new_token({
        name: 'padding',
        fit: fit_padding,
        cast: cast_padding
      });
      first.new_token({
        name: 'zero',
        fit: fit_zero,
        cast: cast_zero
      });
      first.new_token({
        name: 'other',
        fit: fit_other,
        merge: 'list',
        cast: cast_other
      });
      //.......................................................................................................
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    encode(idx_or_vdx) {
      var type;
      /* TAINT use proper validation */
      this.types.idx_or_vdx.validate(idx_or_vdx);
      switch (type = this.types.idx_or_vdx.data.type) {
        case 'idx':
          return this.encode_idx(idx_or_vdx);
        case 'vdx':
          return this._encode_vdx(idx_or_vdx);
      }
      throw new Error(`Ωhll___4 internal error: unknown type ${rpr(type)}`);
    }

    //---------------------------------------------------------------------------------------------------------
    encode_idx(idx) {
      return this._encode_idx(this.types.idx.validate(idx, this.cfg._min_integer, this.cfg._max_integer));
    }

    //---------------------------------------------------------------------------------------------------------
    _encode_idx(idx) {
      var R;
      if ((0 <= idx && idx <= this.cfg._max_zpun)) { // Zero or small positive
        /* NOTE call only where assured `idx` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        return this.cfg._zpuns.at(idx);
      }
      if ((this.cfg._min_nun <= idx && idx < 0)) { // Small negative
        return this.cfg._nuns.at(idx);
      }
      //.......................................................................................................
      if (idx > this.cfg._max_zpun) { // Big positive
        R = encode(idx, this.cfg.digitset);
        return (this.cfg._pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      if (this.cfg.cardinals_only) {
        throw new Error(`Ωhll___5 unable to encode negative idx ${idx} with cardinals-only codec`);
      }
      R = encode(idx + this.cfg._max_integer, this.cfg.digitset); // Big negative
      if (R.length < this.cfg.digits_per_idx) {
        R = R.padStart(this.cfg.digits_per_idx, this.cfg.digitset.at(0));
      } else {
        R = R.replace(this.cfg._leading_novas_re, '');
      }
      return (this.cfg._nmag.at(R.length)) + R;
    }

    //---------------------------------------------------------------------------------------------------------
    encode_vdx(vdx) {
      return this._encode_vdx(this.types.vdx.validate(vdx));
    }

    //---------------------------------------------------------------------------------------------------------
    _encode_vdx(vdx) {
      var idx;
      return (((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = vdx.length; i < len; i++) {
          idx = vdx[i];
          results.push(this.encode_idx(idx));
        }
        return results;
      }).call(this)).join('')).padEnd(this.cfg._sortkey_width, this.cfg._cipher);
    }

    //---------------------------------------------------------------------------------------------------------
    parse(sortkey) {
      var R, data, i, index, len, letters, lexeme, mantissa, name, ref, start, stop;
      R = [];
      ref = this.lexer.scan_to_list(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        lexeme = ref[i];
        ({name, start, stop, data} = lexeme);
        //.....................................................................................................
        ({letters, mantissa, index} = data);
        if ((type_of(letters)) === 'list') {
          letters = letters.join('');
        }
        if (mantissa == null) {
          mantissa = null;
        }
        if (index == null) {
          index = null;
        }
        //.....................................................................................................
        R.push({name, letters, mantissa, index});
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    decode(sortkey) {
      /* TAINT use proper validation */
      var R, i, len, message, ref, type, unit;
      if ((type = type_of(sortkey)) !== 'text') {
        throw new Error(`Ωhll___6 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll___7 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll___8 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
          if (sortkey !== unit.letters) {
            message += ` in ${rpr(sortkey)}`;
          }
          throw new Error(message);
        }
        if (unit.index != null) {
          R.push(unit.index);
        }
      }
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    decode_integer(n) {
      throw new Error("Ωhll___9 not implemented");
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    var hollerith_10, hollerith_10_cardinal, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_10_cardinal = new Hollerith(constants_10_cardinal);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128_16383 = new Hollerith(constants_128_16383);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_10_cardinal, hollerith_128, hollerith_128_16383, test, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLHFCQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLElBQUEsRUFBQSxPQUFBOzs7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsRUFDRSxLQURGLEVBRUUsTUFGRixDQUFBLEdBRTRCLE9BQUEsQ0FBUSxVQUFSLENBRjVCOztFQUdBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsbUJBREYsQ0FBQSxHQUM0QixPQUFBLENBQVEsU0FBUixDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE1BQUYsRUFDRSxNQURGLEVBRUUsV0FGRixFQUdFLG1CQUhGLEVBSUUsZUFKRixDQUFBLEdBSTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUo1Qjs7RUFLQSxDQUFBLENBQUUsTUFBRixDQUFBLEdBQTRCLE1BQTVCOztFQUNBLENBQUEsQ0FBRSxJQUFGLEVBQ0UsVUFERixDQUFBLEdBQzRCLFNBQVMsQ0FBQyw4QkFBVixDQUFBLENBRDVCOztFQUVBLElBQUEsR0FBNEIsT0FBQSxDQUFRLGtCQUFSLEVBeEI1Qjs7O0VBNEJBLGFBQUEsR0FBZ0IsTUFBQSxDQUNkO0lBQUEsV0FBQSxFQUFvQiw2Q0FBcEI7OztJQUdBLFFBQUEsRUFBb0Isa0NBQUEsR0FDQSxrQ0FEQSxHQUVBLGtDQUZBLEdBR0Esa0NBTnBCOzs7SUFTQSxVQUFBLEVBQW9CLG1CQVRwQjtJQVVBLFNBQUEsRUFBb0I7RUFWcEIsQ0FEYyxFQTVCaEI7OztFQTBDQSxtQkFBQSxHQUFzQixNQUFBLENBQ3BCO0lBQUEsV0FBQSxFQUFvQiw2Q0FBcEI7OztJQUdBLFFBQUEsRUFBb0Isa0NBQUEsR0FDQSxrQ0FEQSxHQUVBLGtDQUZBLEdBR0Esa0NBTnBCOzs7SUFTQSxVQUFBLEVBQW9CLG1CQVRwQjtJQVVBLFNBQUEsRUFBb0IsQ0FWcEI7SUFXQSxjQUFBLEVBQW9CO0VBWHBCLENBRG9CLEVBMUN0Qjs7O0VBeURBLFlBQUEsR0FBZSxNQUFBLENBQ2I7SUFBQSxXQUFBLEVBQW9CLFdBQXBCO0lBQ0EsUUFBQSxFQUFvQixZQURwQjtJQUVBLFVBQUEsRUFBb0IsbUJBRnBCO0lBR0EsU0FBQSxFQUFvQjtFQUhwQixDQURhLEVBekRmOzs7RUFnRUEsZUFBQSxHQUFrQixNQUFBLENBQ2hCO0lBQUEsV0FBQSxFQUFvQixHQUFwQjtJQUNBLFFBQUEsRUFBb0IsWUFEcEI7SUFFQSxVQUFBLEVBQW9CLFdBRnBCO0lBR0EsU0FBQSxFQUFvQjtFQUhwQixDQURnQixFQWhFbEI7OztFQXVFQSxnQkFBQSxHQUFtQixNQUFBLENBQ2pCO0lBQUEsV0FBQSxFQUFvQix1QkFBcEI7SUFDQSxRQUFBLEVBQW9CLFlBRHBCO0lBRUEsVUFBQSxFQUFvQixTQUZwQjtJQUdBLFNBQUEsRUFBb0IsQ0FIcEI7SUFJQSxjQUFBLEVBQW9CO0VBSnBCLENBRGlCLEVBdkVuQjs7O0VBK0VBLHFCQUFBLEdBQXdCLE1BQUEsQ0FDdEI7SUFBQSxXQUFBLEVBQW9CLHVCQUFwQjtJQUNBLFFBQUEsRUFBb0IsWUFEcEI7SUFFQSxVQUFBLEVBQW9CLFNBRnBCO0lBR0EsY0FBQSxFQUFvQixJQUhwQjtJQUlBLFNBQUEsRUFBb0IsQ0FKcEI7SUFLQSxjQUFBLEVBQW9CO0VBTHBCLENBRHNCLEVBL0V4Qjs7OztFQXlGQSxTQUFBLEdBQVksQ0FBQSxHQUFJLGFBekZoQjs7O0VBNEZBLFNBQUEsR0FBWSxNQUFBLENBQU87SUFDakIsU0FEaUI7SUFFakIsYUFGaUI7SUFHakIsbUJBSGlCO0lBSWpCLFlBSmlCO0lBS2pCLGVBTGlCO0lBTWpCLGdCQU5pQjtJQU9qQixxQkFQaUI7SUFRakIsS0FBQSxFQUFTLE9BQUEsQ0FBUSxTQUFSO0VBUlEsQ0FBUCxFQTVGWjs7O0VBd0dNLFlBQU4sTUFBQSxVQUFBLENBQUE7O0lBR0UsV0FBYSxDQUFFLEdBQUYsQ0FBQTtBQUNmLFVBQUEsS0FBQSxFQUFBO01BQUksS0FBQSxHQUFrQixJQUFDLENBQUE7TUFDbkIsQ0FBQSxDQUFFLEdBQUYsRUFDRSxLQURGLENBQUEsR0FDa0IsS0FBSyxDQUFDLHdCQUFOLENBQStCLEdBQS9CLENBRGxCO01BRUEsSUFBQyxDQUFBLEdBQUQsR0FBa0IsTUFBQSxDQUFPLEdBQVA7TUFDbEIsSUFBQyxDQUFBLEtBQUQsR0FBa0IsSUFBQyxDQUFBLHFCQUFELENBQXVCLElBQUMsQ0FBQSxHQUF4QjtNQUNsQixJQUFBLENBQUssSUFBTCxFQUFRLE9BQVIsRUFBa0IsS0FBbEI7QUFDQSxhQUFPO0lBUEksQ0FEZjs7O0lBVzZCLE9BQTFCLHdCQUEwQixDQUFFLEdBQUYsQ0FBQTtBQUM3QixVQUFBLENBQUEsRUFBQSxzQkFBQSxFQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBO01BQUksc0JBQUEsR0FFRSxDQUFBOztRQUFBLEtBQUEsRUFBZ0IsTUFBaEI7UUFDQSxTQUFBLEVBQWdCLENBRGhCO1FBRUEsY0FBQSxFQUFnQjtNQUZoQixFQUZOOztNQU1JLENBQUEsR0FBd0IsWUFBQSxDQUFhLENBQUEsQ0FBYixFQUFpQixzQkFBakIsRUFBeUMsR0FBekM7TUFDeEIsS0FBQSxHQUF3QixJQUFJLG1CQUFKLENBQXdCO1FBQUUsS0FBQSxFQUFPLENBQUMsQ0FBQztNQUFYLENBQXhCLEVBUDVCOzs7OztNQVlJLENBQUMsQ0FBQyxjQUFGLEdBQXdCLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBckIsQ0FBOEIsQ0FBQyxDQUFDLGNBQWhDLEVBWjVCOztNQWNJLENBQUMsQ0FBQyxRQUFGLEdBQXdCLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBZixDQUF3QixDQUFDLENBQUMsUUFBMUI7TUFDeEIsQ0FBQyxDQUFDLFlBQUYsR0FBd0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDNUMsQ0FBQyxDQUFDLE9BQUYsR0FBd0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDNUMsQ0FBQyxDQUFDLEtBQUYsR0FBd0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDNUMsQ0FBQyxDQUFDLGlCQUFGLEdBQXdCLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO01BQzVDLENBQUMsQ0FBQyxLQUFGLEdBQXdCLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BbkJoRDs7O01Bc0JJLENBQUMsQ0FBQyxVQUFGLEdBQXdCLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBakIsQ0FBMEIsQ0FBQyxDQUFDLFVBQTVCLEVBQXdDO1FBQUUsY0FBQSxFQUFnQixDQUFDLENBQUM7TUFBcEIsQ0FBeEM7TUFDeEIsQ0FBQyxDQUFDLFVBQUYsR0FBd0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7TUFDOUMsQ0FBQyxDQUFDLFVBQUYsR0FBd0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0F4QmxEOztNQTBCSSxDQUFDLENBQUMsV0FBRixHQUF3QixLQUFLLENBQUMsV0FBVyxDQUFDLFFBQWxCLENBQTJCLENBQUMsQ0FBQyxXQUE3QixFQUEwQztRQUFFLGNBQUEsRUFBZ0IsQ0FBQyxDQUFDO01BQXBCLENBQTFDO01BQ3hCLENBQUMsQ0FBQyxPQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxLQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxNQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxVQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO01BQy9DLENBQUMsQ0FBQyxXQUFGLEdBQXdCLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBL0JuRDs7TUFpQ0ksSUFBRyxDQUFDLENBQUMsT0FBRixLQUFlLENBQUMsQ0FBQyxXQUFXLENBQUUsQ0FBRixDQUEvQjtRQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSxpQ0FBQSxDQUFBLENBQW9DLEdBQUEsQ0FBSSxDQUFDLENBQUMsT0FBTixDQUFwQyxDQUFBLHNCQUFBLENBQUEsQ0FBMEUsR0FBQSxDQUFJLENBQUMsQ0FBQyxNQUFOLENBQTFFLENBQUEsQ0FBVixFQURSOztNQUVBLENBQUMsQ0FBQyxRQUFGLEdBQTJCLG9CQUFILEdBQXNCLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFwQyxHQUFnRDtNQUN4RSxDQUFDLENBQUMsU0FBRixHQUF3QixDQUFDLENBQUMsV0FBVyxDQUFDLE1BQWQsR0FBdUI7TUFDL0MsQ0FBQyxDQUFDLFNBQUYsR0FBd0IsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFoQixDQUF5QixDQUFDLENBQUMsU0FBM0IsRUFyQzVCOzs7UUF1Q0ksQ0FBQyxDQUFDLGlCQUFzQixJQUFJLENBQUMsR0FBTCxDQUFXLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBYixHQUFzQixDQUFqQywyQ0FBMkQsS0FBM0Q7O01BQ3hCLENBQUMsQ0FBQyxjQUFGLEdBQXdCLEtBQUssQ0FBQyxjQUFjLENBQUMsUUFBckIsQ0FBOEIsQ0FBQyxDQUFDLGNBQWhDLEVBQWdELENBQUMsQ0FBQyxVQUFsRDtNQUN4QixDQUFDLENBQUMsWUFBRixHQUF3QixLQUFLLENBQUMsa0JBQU4sQ0FBeUI7UUFBRSxLQUFBLEVBQU8sQ0FBQyxDQUFDLEtBQVg7UUFBa0IsY0FBQSxFQUFnQixDQUFDLENBQUM7TUFBcEMsQ0FBekIsRUF6QzVCOztNQTJDSSxLQUFPLENBQUMsQ0FBQyxjQUFUO1FBQ0UsSUFBRyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQWIsR0FBc0IsQ0FBQyxDQUFDLGNBQTNCO1VBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLDJCQUFBLENBQUEsQ0FBOEIsQ0FBQyxDQUFDLGNBQWhDLENBQUEscUJBQUEsQ0FBQSxDQUFzRSxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQW5GLENBQUEsb0JBQUEsQ0FBVixFQURSO1NBQUEsTUFFSyxJQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBYixHQUFzQixDQUFDLENBQUMsY0FBM0I7VUFDSCxDQUFDLENBQUMsVUFBRixHQUFlLE1BQUEsQ0FBTyxDQUFDLENBQUMsVUFBVSx1Q0FBbkIsRUFEWjtTQUhQO09BM0NKOztNQWlESSxJQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBYixHQUFzQixDQUFDLENBQUMsY0FBM0I7UUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsMkJBQUEsQ0FBQSxDQUE4QixDQUFDLENBQUMsY0FBaEMsQ0FBQSxxQkFBQSxDQUFBLENBQXNFLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBbkYsQ0FBQSxvQkFBQSxDQUFWLEVBRFI7T0FBQSxNQUVLLElBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFiLEdBQXNCLENBQUMsQ0FBQyxjQUEzQjtRQUNILENBQUMsQ0FBQyxVQUFGLEdBQWUsTUFBQSxDQUFPLENBQUMsQ0FBQyxVQUFVLHVDQUFuQixFQURaO09BbkRUOztNQXNESSxDQUFDLENBQUMsS0FBRixHQUF3QixDQUFDLENBQUMsVUFBVSxDQUFDLElBQWIsQ0FBa0IsRUFBbEI7TUFDeEIsQ0FBQyxDQUFDLEtBQUYsR0FBMkIsQ0FBQyxDQUFDLGNBQUwsR0FBeUIsSUFBekIsR0FBbUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFiLENBQWtCLEVBQWxCO01BQzNELENBQUMsQ0FBQyxjQUFGLEdBQXdCLENBQUMsQ0FBQyxjQUFGLEdBQW1CO01BQzNDLENBQUMsQ0FBQyxjQUFGLEdBQXdCLENBQUMsQ0FBQyxjQUFGLEdBQW1CLENBQUMsQ0FBQyxVQXpEakQ7O01BMkRJLENBQUMsQ0FBQyxZQUFGLEdBQTJCLENBQUMsQ0FBQyxjQUFMLEdBQXlCLENBQXpCLEdBQWdDLENBQUMsQ0FBQyxDQUFDLGFBM0QvRDs7Ozs7TUFnRUksS0FBQSxHQUEyQixDQUFDLENBQUMsY0FBTCxHQUF5QixFQUF6QixHQUFpQyxDQUFFLEdBQUEsQ0FBQyxDQUFDLFVBQUosQ0FBb0IsQ0FBQyxPQUFyQixDQUFBLENBQThCLENBQUMsSUFBL0IsQ0FBb0MsRUFBcEM7TUFDekQsSUFBQSxHQUEyQixDQUFDLENBQUMsY0FBTCxHQUF5QixFQUF6QixHQUFpQyxDQUFDLENBQUM7TUFDM0QsQ0FBQyxDQUFDLFNBQUYsR0FDRSxDQUFDLENBQUMsUUFBRixHQUNBLEtBREEsR0FFQSxnQkFBRSxPQUFPLEVBQVQsQ0FGQSxHQUdBLENBQUMsQ0FBQyxNQUhGLEdBSUEsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDLFNBQUYsR0FBd0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFaLENBQW9CLEtBQUssQ0FBQyxHQUFELENBQUssQ0FBQyxjQUEvQixFQUFnRCxFQUFoRCxFQXhFNUI7O01BMEVJLENBQUMsQ0FBQyxTQUFGLEdBQXdCLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBaEIsQ0FBeUIsQ0FBQyxDQUFDLFNBQTNCO0FBQ3hCLGFBQU87UUFBRSxHQUFBLEVBQUssQ0FBUDtRQUFVO01BQVY7SUE1RWtCLENBWDdCOzs7SUEwRkUscUJBQXVCLENBQUUsR0FBRixDQUFBO0FBQ3pCLFVBQUEsQ0FBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxVQUFBLEVBQUEsWUFBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLFFBQUEsRUFBQSxLQUFBLEVBQUEsUUFBQSxFQUFBLE9BQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLFFBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLGlCQUFBLEVBQUEsU0FBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTtNQUFJLENBQUEsQ0FBRSxLQUFGLEVBQ0UsTUFERixFQUVFLEtBRkYsRUFHRSxLQUhGLEVBSUUsUUFKRixDQUFBLEdBSW9CLEdBSnBCLEVBQUo7O01BTUksaUJBQUEsR0FBb0IsQ0FBSSxHQUFHLENBQUMsZUFOaEM7O01BUUksWUFBQSxHQUFnQixNQUFNO01BQ3RCLFlBQUEsR0FBZ0IsS0FBSztNQUNyQixZQUFBLEdBQWdCLE1BQU0sQ0FBRyxDQUFIO01BQ3RCLFNBQUEsR0FBZ0IsUUFBUSxDQUFDLEVBQVQsQ0FBWSxDQUFDLENBQWIsRUFYcEI7O01BYUksT0FBQSxHQUFnQixLQUFLLENBQUEsY0FBQSxDQUFBLENBQWlCLFlBQWpCLENBQUEsdUNBQUE7TUFDckIsUUFBQSxHQUFnQixLQUFLLENBQUEsY0FBQSxDQUFBLENBQWlCLFlBQWpCLENBQUEscUJBQUEsQ0FBQSxDQUFxRCxRQUFyRCxDQUFBLE9BQUE7TUFDckIsV0FBQSxHQUFnQixLQUFLLENBQUEsY0FBQSxDQUFBLENBQWlCLFlBQWpCLENBQUEsdUNBQUE7TUFDckIsUUFBQSxHQUFnQixLQUFLLENBQUEsY0FBQSxDQUFBLENBQWlCLFlBQWpCLENBQUEsY0FBQSxDQUFBLENBQThDLFlBQTlDLENBQUEsV0FBQTtNQUNyQixTQUFBLEdBQWdCLEtBQUssQ0FBQSxvRUFBQTtNQUNyQixXQUFBLEdBQWdCLEtBQUssQ0FBQSxFQUFBLENBQUEsQ0FBSyxZQUFMLENBQUEsR0FBQSxFQWxCekI7O01Bb0JJLFFBQUEsR0FBZ0IsUUFBQSxDQUFDO1VBQUUsSUFBQSxFQUFNO1FBQVIsQ0FBRCxDQUFBO2VBQWtCLENBQUMsQ0FBQyxLQUFGLEdBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQVgsQ0FBb0IsQ0FBQyxDQUFDLE9BQXRCO01BQTdCO01BQ2hCLFNBQUEsR0FBZ0IsUUFBQSxDQUFDO1VBQUUsSUFBQSxFQUFNO1FBQVIsQ0FBRCxDQUFBO2VBQWtCLENBQUMsQ0FBQyxLQUFGLEdBQVUsTUFBQSxDQUFPLENBQUMsQ0FBQyxRQUFULEVBQW1CLFFBQW5CO01BQTVCO01BQ2hCLFNBQUEsR0FBZ0IsUUFBQSxDQUFDO1VBQUUsSUFBQSxFQUFNO1FBQVIsQ0FBRCxDQUFBO2VBQWtCLENBQUMsQ0FBQyxLQUFGLEdBQVU7TUFBNUI7TUFDaEIsWUFBQSxHQUFnQixRQUFBLENBQUM7VUFBRSxJQUFBLEVBQU0sQ0FBUjtVQUFXLE1BQVg7VUFBbUI7UUFBbkIsQ0FBRCxDQUFBO1FBQStCLElBQWUsTUFBQSxLQUFVLEdBQXpCO2lCQUFBLENBQUMsQ0FBQyxLQUFGLEdBQVUsRUFBVjs7TUFBL0I7TUFDaEIsVUFBQSxHQUFnQixLQXhCcEI7O01BMEJJLElBQUcsaUJBQUg7UUFDRSxZQUFBLEdBQWdCO1FBQ2hCLFlBQUEsR0FBZ0IsS0FBSztRQUNyQixPQUFBLEdBQWdCLEtBQUssQ0FBQSxjQUFBLENBQUEsQ0FBaUIsWUFBakIsQ0FBQSx1Q0FBQTtRQUNyQixRQUFBLEdBQWdCLEtBQUssQ0FBQSxjQUFBLENBQUEsQ0FBaUIsWUFBakIsQ0FBQSxxQkFBQSxDQUFBLENBQXFELFFBQXJELENBQUEsT0FBQTtRQUNyQixRQUFBLEdBQWdCLFFBQUEsQ0FBQztZQUFFLElBQUEsRUFBTTtVQUFSLENBQUQsQ0FBQTtpQkFBa0IsQ0FBQyxDQUFDLEtBQUYsR0FBVSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBVixDQUFrQixDQUFDLENBQUMsT0FBcEIsQ0FBRixDQUFBLEdBQWtDLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFBeEU7UUFDaEIsU0FBQSxHQUFnQixRQUFBLENBQUM7WUFBRSxJQUFBLEVBQU07VUFBUixDQUFELENBQUE7QUFDdEIsY0FBQTtVQUFRLFFBQUEsR0FBWSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVgsQ0FBb0IsR0FBRyxDQUFDLGNBQXhCLEVBQXdDLFNBQXhDO2lCQUNaLENBQUMsQ0FBQyxLQUFGLEdBQVksQ0FBRSxNQUFBLENBQU8sUUFBUCxFQUFpQixRQUFqQixDQUFGLENBQUEsR0FBZ0MsR0FBRyxDQUFDO1FBRmxDLEVBTmxCO09BMUJKOztNQW9DSSxDQUFBLEdBQWdCLElBQUksT0FBSixDQUFZO1FBQUUsWUFBQSxFQUFjO01BQWhCLENBQVo7TUFDaEIsS0FBQSxHQUFnQixDQUFDLENBQUMsU0FBRixDQUFZO1FBQUUsSUFBQSxFQUFNO01BQVIsQ0FBWjtNQUNoQixJQUErRixpQkFBL0Y7UUFBQSxLQUFLLENBQUMsU0FBTixDQUFrQjtVQUFFLElBQUEsRUFBTSxLQUFSO1VBQW9CLEdBQUEsRUFBSyxPQUF6QjtVQUFtRCxJQUFBLEVBQU07UUFBekQsQ0FBbEIsRUFBQTs7TUFDQSxLQUFLLENBQUMsU0FBTixDQUFrQjtRQUFFLElBQUEsRUFBTSxLQUFSO1FBQW9CLEdBQUEsRUFBSyxPQUF6QjtRQUFtRCxJQUFBLEVBQU07TUFBekQsQ0FBbEI7TUFDQSxJQUErRixpQkFBL0Y7UUFBQSxLQUFLLENBQUMsU0FBTixDQUFrQjtVQUFFLElBQUEsRUFBTSxNQUFSO1VBQW9CLEdBQUEsRUFBSyxRQUF6QjtVQUFtRCxJQUFBLEVBQU07UUFBekQsQ0FBbEIsRUFBQTs7TUFDQSxLQUFLLENBQUMsU0FBTixDQUFrQjtRQUFFLElBQUEsRUFBTSxNQUFSO1FBQW9CLEdBQUEsRUFBSyxRQUF6QjtRQUFtRCxJQUFBLEVBQU07TUFBekQsQ0FBbEI7TUFDQSxLQUFLLENBQUMsU0FBTixDQUFrQjtRQUFFLElBQUEsRUFBTSxTQUFSO1FBQW9CLEdBQUEsRUFBSyxXQUF6QjtRQUFtRCxJQUFBLEVBQU07TUFBekQsQ0FBbEI7TUFDQSxLQUFLLENBQUMsU0FBTixDQUFrQjtRQUFFLElBQUEsRUFBTSxNQUFSO1FBQW9CLEdBQUEsRUFBSyxRQUF6QjtRQUFtRCxJQUFBLEVBQU07TUFBekQsQ0FBbEI7TUFDQSxLQUFLLENBQUMsU0FBTixDQUFrQjtRQUFFLElBQUEsRUFBTSxPQUFSO1FBQW9CLEdBQUEsRUFBSyxTQUF6QjtRQUFvQyxLQUFBLEVBQU8sTUFBM0M7UUFBbUQsSUFBQSxFQUFNO01BQXpELENBQWxCLEVBNUNKOztBQThDSSxhQUFPO0lBL0NjLENBMUZ6Qjs7O0lBNElFLE1BQVEsQ0FBRSxVQUFGLENBQUE7QUFDVixVQUFBLElBQUE7O01BQ0ksSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBbEIsQ0FBMkIsVUFBM0I7QUFDQSxjQUFPLElBQUEsR0FBTyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBckM7QUFBQSxhQUNPLEtBRFA7QUFDa0IsaUJBQU8sSUFBQyxDQUFBLFVBQUQsQ0FBYSxVQUFiO0FBRHpCLGFBRU8sS0FGUDtBQUVrQixpQkFBTyxJQUFDLENBQUEsV0FBRCxDQUFhLFVBQWI7QUFGekI7TUFHQSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsc0NBQUEsQ0FBQSxDQUF5QyxHQUFBLENBQUksSUFBSixDQUF6QyxDQUFBLENBQVY7SUFOQSxDQTVJVjs7O0lBcUpFLFVBQVksQ0FBRSxHQUFGLENBQUE7YUFBVyxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVgsQ0FBb0IsR0FBcEIsRUFBeUIsSUFBQyxDQUFBLEdBQUcsQ0FBQyxZQUE5QixFQUE0QyxJQUFDLENBQUEsR0FBRyxDQUFDLFlBQWpELENBQWI7SUFBWCxDQXJKZDs7O0lBd0pFLFdBQWEsQ0FBRSxHQUFGLENBQUE7QUFDZixVQUFBO01BRUksSUFBaUMsQ0FBQSxDQUFBLElBQWtCLEdBQWxCLElBQWtCLEdBQWxCLElBQXlCLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBOUIsQ0FBakM7OztBQUFBLGVBQVMsSUFBQyxDQUFBLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBWixDQUFlLEdBQWYsRUFBVDs7TUFDQSxJQUFpQyxDQUFBLElBQUMsQ0FBQSxHQUFHLENBQUMsUUFBTCxJQUFrQixHQUFsQixJQUFrQixHQUFsQixHQUF5QixDQUF6QixDQUFqQztBQUFBLGVBQVMsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBWCxDQUFlLEdBQWYsRUFBVDtPQUhKOztNQUtJLElBQUcsR0FBQSxHQUFNLElBQUMsQ0FBQSxHQUFHLENBQUMsU0FBZDtRQUNFLENBQUEsR0FBSSxNQUFBLENBQU8sR0FBUCxFQUFZLElBQUMsQ0FBQSxHQUFHLENBQUMsUUFBakI7QUFDSixlQUFPLENBQUUsSUFBQyxDQUFBLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBWCxDQUFjLENBQUMsQ0FBQyxNQUFoQixDQUFGLENBQUEsR0FBNkIsRUFGdEM7T0FMSjs7TUFTSSxJQUFHLElBQUMsQ0FBQSxHQUFHLENBQUMsY0FBUjtRQUNFLE1BQU0sSUFBSSxLQUFKLENBQVUsQ0FBQSx1Q0FBQSxDQUFBLENBQTBDLEdBQTFDLENBQUEsMEJBQUEsQ0FBVixFQURSOztNQUVBLENBQUEsR0FBTSxNQUFBLENBQVMsR0FBQSxHQUFNLElBQUMsQ0FBQSxHQUFHLENBQUMsWUFBcEIsRUFBd0MsSUFBQyxDQUFBLEdBQUcsQ0FBQyxRQUE3QyxFQVhWO01BWUksSUFBRyxDQUFDLENBQUMsTUFBRixHQUFXLElBQUMsQ0FBQSxHQUFHLENBQUMsY0FBbkI7UUFBdUMsQ0FBQSxHQUFJLENBQUMsQ0FBQyxRQUFGLENBQVcsSUFBQyxDQUFBLEdBQUcsQ0FBQyxjQUFoQixFQUFnQyxJQUFDLENBQUEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFkLENBQWlCLENBQWpCLENBQWhDLEVBQTNDO09BQUEsTUFBQTtRQUN3QyxDQUFBLEdBQUksQ0FBQyxDQUFDLE9BQUYsQ0FBVSxJQUFDLENBQUEsR0FBRyxDQUFDLGlCQUFmLEVBQWtDLEVBQWxDLEVBRDVDOztBQUVBLGFBQU8sQ0FBRSxJQUFDLENBQUEsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFYLENBQWMsQ0FBQyxDQUFDLE1BQWhCLENBQUYsQ0FBQSxHQUE2QjtJQWZ6QixDQXhKZjs7O0lBMEtFLFVBQVksQ0FBRSxHQUFGLENBQUE7YUFBVyxJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVgsQ0FBb0IsR0FBcEIsQ0FBYjtJQUFYLENBMUtkOzs7SUE2S0UsV0FBYSxDQUFFLEdBQUYsQ0FBQTtBQUFVLFVBQUE7YUFDckIsQ0FBRTs7QUFBRTtRQUFBLEtBQUEscUNBQUE7O3VCQUFBLElBQUMsQ0FBQSxVQUFELENBQVksR0FBWjtRQUFBLENBQUE7O21CQUFGLENBQWtDLENBQUMsSUFBbkMsQ0FBd0MsRUFBeEMsQ0FBRixDQUE4QyxDQUFDLE1BQS9DLENBQXNELElBQUMsQ0FBQSxHQUFHLENBQUMsY0FBM0QsRUFBMkUsSUFBQyxDQUFBLEdBQUcsQ0FBQyxPQUFoRjtJQURXLENBN0tmOzs7SUFpTEUsS0FBTyxDQUFFLE9BQUYsQ0FBQTtBQUNULFVBQUEsQ0FBQSxFQUFBLElBQUEsRUFBQSxDQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQSxJQUFBLEVBQUEsR0FBQSxFQUFBLEtBQUEsRUFBQTtNQUFJLENBQUEsR0FBSTtBQUNKO01BQUEsS0FBQSxxQ0FBQTs7UUFDRSxDQUFBLENBQUUsSUFBRixFQUNFLEtBREYsRUFFRSxJQUZGLEVBR0UsSUFIRixDQUFBLEdBR2tCLE1BSGxCLEVBQU47O1FBS00sQ0FBQSxDQUFFLE9BQUYsRUFDRSxRQURGLEVBRUUsS0FGRixDQUFBLEdBRWtCLElBRmxCO1FBR0EsSUFBcUMsQ0FBRSxPQUFBLENBQVEsT0FBUixDQUFGLENBQUEsS0FBdUIsTUFBNUQ7VUFBQSxPQUFBLEdBQWtCLE9BQU8sQ0FBQyxJQUFSLENBQWEsRUFBYixFQUFsQjs7O1VBQ0EsV0FBa0I7OztVQUNsQixRQUFrQjtTQVZ4Qjs7UUFZTSxDQUFDLENBQUMsSUFBRixDQUFPLENBQUUsSUFBRixFQUFRLE9BQVIsRUFBaUIsUUFBakIsRUFBMkIsS0FBM0IsQ0FBUDtNQWJGO0FBY0EsYUFBTztJQWhCRixDQWpMVDs7O0lBb01FLE1BQVEsQ0FBRSxPQUFGLENBQUEsRUFBQTs7QUFDVixVQUFBLENBQUEsRUFBQSxDQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO01BQ0ksSUFBTyxDQUFFLElBQUEsR0FBTyxPQUFBLENBQVEsT0FBUixDQUFULENBQUEsS0FBOEIsTUFBckM7UUFDRSxNQUFNLElBQUksS0FBSixDQUFVLENBQUEsZ0NBQUEsQ0FBQSxDQUFtQyxJQUFuQyxDQUFBLENBQVYsRUFEUjs7TUFFQSxNQUFPLE9BQU8sQ0FBQyxNQUFSLEdBQWlCLEVBQXhCO1FBQ0UsTUFBTSxJQUFJLEtBQUosQ0FBVSxDQUFBLHdDQUFBLENBQUEsQ0FBMkMsR0FBQSxDQUFJLE9BQUosQ0FBM0MsQ0FBQSxDQUFWLEVBRFI7O01BRUEsQ0FBQSxHQUFJO0FBQ0o7TUFBQSxLQUFBLHFDQUFBOztRQUNFLElBQUcsSUFBSSxDQUFDLElBQUwsS0FBYSxPQUFoQjtVQUNFLE9BQUEsR0FBWSxDQUFBLDhDQUFBLENBQUEsQ0FBaUQsR0FBQSxDQUFJLElBQUksQ0FBQyxPQUFULENBQWpELENBQUE7VUFDWixJQUFvQyxPQUFBLEtBQWEsSUFBSSxDQUFDLE9BQXREO1lBQUEsT0FBQSxJQUFZLENBQUEsSUFBQSxDQUFBLENBQU8sR0FBQSxDQUFJLE9BQUosQ0FBUCxDQUFBLEVBQVo7O1VBQ0EsTUFBTSxJQUFJLEtBQUosQ0FBVSxPQUFWLEVBSFI7O1FBSUEsSUFBcUIsa0JBQXJCO1VBQUEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFJLENBQUMsS0FBWixFQUFBOztNQUxGO0FBTUEsYUFBTztJQWJELENBcE1WOzs7SUFvTkUsY0FBZ0IsQ0FBRSxDQUFGLENBQUE7TUFDZCxNQUFNLElBQUksS0FBSixDQUFVLDBCQUFWO0lBRFE7O0VBdE5sQixFQXhHQTs7O0VBa1VBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQSxZQUFBLEVBQUEscUJBQUEsRUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUE7SUFBRSxZQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLFlBQWQ7SUFDeEIsZUFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxlQUFkO0lBQ3hCLGdCQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLGdCQUFkO0lBQ3hCLHFCQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLHFCQUFkO0lBQ3hCLGFBQUEsR0FBd0IsSUFBSSxTQUFKLENBQWMsYUFBZDtJQUN4QixtQkFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxtQkFBZDtBQUN4QixXQUFPLENBQ0wsU0FESyxFQUVMLFlBRkssRUFHTCxlQUhLLEVBSUwsZ0JBSkssRUFLTCxxQkFMSyxFQU1MLGFBTkssRUFPTCxtQkFQSyxFQVFMLElBUkssRUFTTCxTQVRLO0VBUFcsQ0FBQTtBQWxVcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgR3JhbW1hclxuICBUb2tlblxuICBMZXhlbWUgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xueyBDRkcsXG4gIEhvbGxlcml0aF90eXBlc3BhY2UsICB9ID0gcmVxdWlyZSAnLi90eXBlcydcbnsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxueyBlbmNvZGUsXG4gIGRlY29kZSxcbiAgbG9nX3RvX2Jhc2UsXG4gIGdldF9yZXF1aXJlZF9kaWdpdHMsXG4gIGdldF9tYXhfaW50ZWdlciwgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG50ZXN0ICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi90ZXN0LWhvbGxlcml0aCdcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjggPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIyMgICAgICAgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4XzE2MzgzID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgMlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5Egw6Mgw6TDpcOmJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdOJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdKS0xNIE9QUVInXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cDIgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgICAgICAgIDNcbiAgZGlnaXRzX3Blcl9pZHg6ICAgICAzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwX2NhcmRpbmFsID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ0VGR0hJSktMTSBOIE9QUVJTVFVWVydcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnQUJDIFhZWidcbiAgY2FyZGluYWxzX29ubHk6ICAgICB0cnVlICMgbm9uZWdhdGl2ZXNcbiAgZGltZW5zaW9uOiAgICAgICAgICAzXG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgM1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMjhcbmNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbnRlcm5hbHMgPSBmcmVlemUge1xuICBjb25zdGFudHMsXG4gIGNvbnN0YW50c18xMjgsXG4gIGNvbnN0YW50c18xMjhfMTYzODMsXG4gIGNvbnN0YW50c18xMCxcbiAgY29uc3RhbnRzXzEwbXZwLFxuICBjb25zdGFudHNfMTBtdnAyLFxuICBjb25zdGFudHNfMTBfY2FyZGluYWwsXG4gIHR5cGVzOiAoIHJlcXVpcmUgJy4vdHlwZXMnICksIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICB7IGNmZyxcbiAgICAgIHR5cGVzLCAgICAgIH0gPSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGNmZyAgICAgICAgICAgID0gZnJlZXplIGNmZ1xuICAgIEBsZXhlciAgICAgICAgICA9IEBjb21waWxlX3NvcnRrZXlfbGV4ZXIgQGNmZ1xuICAgIGhpZGUgQCwgJ3R5cGVzJywgIHR5cGVzXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUgPVxuICAgICAgIyBwbGFjZWhvbGRlcjogICAgJ1xceDAwJ1xuICAgICAgYmxhbms6ICAgICAgICAgICdcXHgyMCdcbiAgICAgIGRpbWVuc2lvbjogICAgICA1XG4gICAgICBjYXJkaW5hbHNfb25seTogZmFsc2VcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgICAgICAgICAgICA9IGNsZWFuX2Fzc2lnbiB7fSwgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSwgY2ZnXG4gICAgdHlwZXMgICAgICAgICAgICAgICAgID0gbmV3IEhvbGxlcml0aF90eXBlc3BhY2UgeyBibGFuazogUi5ibGFuaywgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBSLnBsYWNlaG9sZGVyICAgICAgICAgPSB0eXBlcy5wbGFjZWhvbGRlci52YWxpZGF0ZSBSLnBsYWNlaG9sZGVyXG4gICAgIyBSLl9wbGFjZWhvbGRlcnNfcmUgICAgPSB0eXBlcy5wbGFjZWhvbGRlci5kYXRhLl9wbGFjZWhvbGRlcnNfcmVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuY2FyZGluYWxzX29ubHkgICAgICA9IHR5cGVzLmNhcmRpbmFsc19vbmx5LnZhbGlkYXRlIFIuY2FyZGluYWxzX29ubHlcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuZGlnaXRzZXQgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LnZhbGlkYXRlIFIuZGlnaXRzZXRcbiAgICBSLl9kaWdpdHNfbGlzdCAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9kaWdpdHNfbGlzdFxuICAgIFIuX25hdWdodCAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX25hdWdodFxuICAgIFIuX25vdmEgICAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX25vdmFcbiAgICBSLl9sZWFkaW5nX25vdmFzX3JlICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9sZWFkaW5nX25vdmFzX3JlXG4gICAgUi5fYmFzZSAgICAgICAgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fYmFzZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBSLm1hZ25pZmllcnMgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLnZhbGlkYXRlIFIubWFnbmlmaWVycywgeyBjYXJkaW5hbHNfb25seTogUi5jYXJkaW5hbHNfb25seSwgX3BsYWNlaG9sZGVyc19yZTogUi5fcGxhY2Vob2xkZXJzX3JlLCB9XG4gICAgUi5tYWduaWZpZXJzICAgICAgICAgID0gdHlwZXMubWFnbmlmaWVycy52YWxpZGF0ZSBSLm1hZ25pZmllcnMsIHsgY2FyZGluYWxzX29ubHk6IFIuY2FyZGluYWxzX29ubHksIH1cbiAgICBSLl9wbWFnX2xpc3QgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLmRhdGEuX3BtYWdfbGlzdFxuICAgIFIuX25tYWdfbGlzdCAgICAgICAgICA9IHR5cGVzLm1hZ25pZmllcnMuZGF0YS5fbm1hZ19saXN0XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy52YWxpZGF0ZSBSLnVuaWxpdGVyYWxzLCB7IGNhcmRpbmFsc19vbmx5OiBSLmNhcmRpbmFsc19vbmx5LCB9XG4gICAgUi5fY2lwaGVyICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fY2lwaGVyXG4gICAgUi5fbnVucyAgICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc1xuICAgIFIuX3pwdW5zICAgICAgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX3pwdW5zXG4gICAgUi5fbnVuc19saXN0ICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc19saXN0XG4gICAgUi5fenB1bnNfbGlzdCAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNfbGlzdFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5fY2lwaGVyIGlzbnQgUi5fenB1bnNfbGlzdFsgMCBdXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgaW50ZXJuYWwgZXJyb3I6IF9jaXBoZXIgI3tycHIgUi5fY2lwaGVyfSBkb2Vzbid0IG1hdGNoIF96cHVucyAje3JwciBSLl96cHVuc31cIlxuICAgIFIuX21pbl9udW4gICAgICAgICAgICA9IGlmIFIuX251bnNfbGlzdD8gdGhlbiAtUi5fbnVuc19saXN0Lmxlbmd0aCBlbHNlIDBcbiAgICBSLl9tYXhfenB1biAgICAgICAgICAgPSBSLl96cHVuc19saXN0Lmxlbmd0aCAtIDFcbiAgICBSLmRpbWVuc2lvbiAgICAgICAgICAgPSB0eXBlcy5kaW1lbnNpb24udmFsaWRhdGUgUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuZGlnaXRzX3Blcl9pZHggICAgID89IE1hdGgubWluICggUi5fcG1hZ19saXN0Lmxlbmd0aCAtIDEgKSwgKCBSLmRpZ2l0c19wZXJfaWR4ID8gSW5maW5pdHkgKVxuICAgIFIuZGlnaXRzX3Blcl9pZHggICAgICA9IHR5cGVzLmRpZ2l0c19wZXJfaWR4LnZhbGlkYXRlIFIuZGlnaXRzX3Blcl9pZHgsIFIuX3BtYWdfbGlzdFxuICAgIFIuX21heF9pbnRlZ2VyICAgICAgICA9IHR5cGVzLmNyZWF0ZV9tYXhfaW50ZWdlciB7IF9iYXNlOiBSLl9iYXNlLCBkaWdpdHNfcGVyX2lkeDogUi5kaWdpdHNfcGVyX2lkeCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzIFIuY2FyZGluYWxzX29ubHlcbiAgICAgIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPCBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMiBkaWdpdHNfcGVyX2lkeCBpcyAje1IuZGlnaXRzX3Blcl9pZHh9LCBidXQgdGhlcmUgYXJlIG9ubHkgI3tSLl9ubWFnX2xpc3QubGVuZ3RofSBwb3NpdGl2ZSBtYWduaWZpZXJzXCJcbiAgICAgIGVsc2UgaWYgUi5fbm1hZ19saXN0Lmxlbmd0aCA+IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgICAgUi5fbm1hZ19saXN0ID0gZnJlZXplIFIuX25tYWdfbGlzdFsgLi4gUi5kaWdpdHNfcGVyX2lkeCBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBSLl9wbWFnX2xpc3QubGVuZ3RoIDwgUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18zIGRpZ2l0c19wZXJfaWR4IGlzICN7Ui5kaWdpdHNfcGVyX2lkeH0sIGJ1dCB0aGVyZSBhcmUgb25seSAje1IuX3BtYWdfbGlzdC5sZW5ndGh9IHBvc2l0aXZlIG1hZ25pZmllcnNcIlxuICAgIGVsc2UgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA+IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgIFIuX3BtYWdfbGlzdCA9IGZyZWV6ZSBSLl9wbWFnX2xpc3RbIC4uIFIuZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5fcG1hZyAgICAgICAgICAgICAgID0gUi5fcG1hZ19saXN0LmpvaW4gJydcbiAgICBSLl9ubWFnICAgICAgICAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gbnVsbCBlbHNlIFIuX25tYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbWF4X2lkeF93aWR0aCAgICAgID0gUi5kaWdpdHNfcGVyX2lkeCArIDFcbiAgICBSLl9zb3J0a2V5X3dpZHRoICAgICAgPSBSLl9tYXhfaWR4X3dpZHRoICogUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX21pbl9pbnRlZ2VyICAgICAgICA9IGlmIFIuY2FyZGluYWxzX29ubHkgdGhlbiAwIGVsc2UgLVIuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgVEFJTlQgdGhpcyBjYW4gYmUgZ3JlYXRseSBzaW1wbGlmaWVkIHdpdGggVG8gRG9zIGltcGxlbWVudGVkICMjI1xuICAgICMjIyBUQUlOVCB3aGlsZSB0cmVhdG1lbnQgb2YgTlVOcywgWlBVTnMgaXMgdW5zYXRpc2ZhY3RvcnkgdGhleSdyZSBzY2hlZHVsZWQgdG8gYmUgcmVtb3ZlZCBhbnl3YXlzIHNvXG4gICAgICAgIHdlIHJlZnJhaW4gZnJvbSBpbXByb3ZpbmcgdGhhdCAjIyNcbiAgICBubWFncyAgICAgICAgICAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gJycgZWxzZSBbIFIuX25tYWdfbGlzdC4uLiwgXS5yZXZlcnNlKCkuam9pbiAnJ1xuICAgIG51bnMgICAgICAgICAgICAgICAgICA9IGlmIFIuY2FyZGluYWxzX29ubHkgdGhlbiAnJyBlbHNlIFIuX251bnNcbiAgICBSLl9hbHBoYWJldCAgICAgICAgICAgPSAgICAgICBcXFxuICAgICAgUi5kaWdpdHNldCAgICAgICAgICAgICAgICArIFxcXG4gICAgICBubWFncyAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgICggbnVucyA/ICcnICkgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5fenB1bnMgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLl9wbWFnXG4gICAgUi5fYWxwaGFiZXQgICAgICAgICAgID0gUi5fYWxwaGFiZXQucmVwbGFjZSB0eXBlc1tDRkddLmJsYW5rX3NwbGl0dGVyLCAgJydcbiAgICAjIFIuX2FscGhhYmV0ICAgICAgICAgICA9IFIuX2FscGhhYmV0LnJlcGxhY2UgUi5fcGxhY2Vob2xkZXJzX3JlLCAgICAgICAgICcnXG4gICAgUi5fYWxwaGFiZXQgICAgICAgICAgID0gdHlwZXMuX2FscGhhYmV0LnZhbGlkYXRlIFIuX2FscGhhYmV0XG4gICAgcmV0dXJuIHsgY2ZnOiBSLCB0eXBlcywgfVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBfbnVucyxcbiAgICAgIF96cHVucyxcbiAgICAgIF9ubWFnLFxuICAgICAgX3BtYWcsXG4gICAgICBkaWdpdHNldCwgICAgIH0gPSBjZmdcbiAgICAjIF9iYXNlICAgICAgICAgICAgICA9IGRpZ2l0c2V0Lmxlbmd0aFxuICAgIGluY2x1ZGVfbmVnYXRpdmVzID0gbm90IGNmZy5jYXJkaW5hbHNfb25seVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcHVuc19sZXR0ZXJzICA9IF96cHVuc1sgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gX3BtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSBfenB1bnNbICAwICAgICBdXG4gICAgbWF4X2RpZ2l0ICAgICA9IGRpZ2l0c2V0LmF0IC0xXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmaXRfcHVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twdW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfcG51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twbWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcGFkZGluZyAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0rICkgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfemVybyAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0gICg/PSAuKiBbXiAje3plcm9fbGV0dGVyc30gXSApICkgICAgIFwiXG4gICAgZml0X290aGVyICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiAuICAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgYWxsX3plcm9fcmUgICA9IHJlZ2V4XCJeICN7emVyb19sZXR0ZXJzfSsgJFwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuX3pwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGRpZ2l0c2V0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGluY2x1ZGVfbmVnYXRpdmVzXG4gICAgICBudW5zX2xldHRlcnMgID0gX251bnNcbiAgICAgIG5tYWdfbGV0dGVycyAgPSBfbm1hZ1sgICAxIC4uICBdXG4gICAgICBmaXRfbnVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tudW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICAgIGZpdF9ubnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje25tYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2RpZ2l0c2V0fSAgXSogKSBcIlxuICAgICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5fbnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLl9udW5zLmxlbmd0aFxuICAgICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICAgIG1hbnRpc3NhICA9IGQubWFudGlzc2EucGFkU3RhcnQgY2ZnLmRpZ2l0c19wZXJfaWR4LCBtYXhfZGlnaXRcbiAgICAgICAgZC5pbmRleCAgID0gKCBkZWNvZGUgbWFudGlzc2EsIGRpZ2l0c2V0ICkgLSBjZmcuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH0gaWYgaW5jbHVkZV9uZWdhdGl2ZXNcbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfSBpZiBpbmNsdWRlX25lZ2F0aXZlc1xuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaWR4X29yX3ZkeCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBAdHlwZXMuaWR4X29yX3ZkeC52YWxpZGF0ZSBpZHhfb3JfdmR4XG4gICAgc3dpdGNoIHR5cGUgPSBAdHlwZXMuaWR4X29yX3ZkeC5kYXRhLnR5cGVcbiAgICAgIHdoZW4gJ2lkeCcgdGhlbiByZXR1cm4gQGVuY29kZV9pZHggIGlkeF9vcl92ZHhcbiAgICAgIHdoZW4gJ3ZkeCcgdGhlbiByZXR1cm4gQF9lbmNvZGVfdmR4IGlkeF9vcl92ZHhcbiAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzQgaW50ZXJuYWwgZXJyb3I6IHVua25vd24gdHlwZSAje3JwciB0eXBlfVwiXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaWR4OiAoIGlkeCApIC0+IEBfZW5jb2RlX2lkeCBAdHlwZXMuaWR4LnZhbGlkYXRlIGlkeCwgQGNmZy5fbWluX2ludGVnZXIsIEBjZmcuX21heF9pbnRlZ2VyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBfZW5jb2RlX2lkeDogKCBpZHggKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBpZHhgIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuICggQGNmZy5fenB1bnMuYXQgaWR4ICkgaWYgMCAgICAgICAgICAgICAgPD0gaWR4IDw9IEBjZmcuX21heF96cHVuICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmVcbiAgICByZXR1cm4gKCBAY2ZnLl9udW5zLmF0ICBpZHggKSBpZiBAY2ZnLl9taW5fbnVuICA8PSBpZHggPCAgMCAgICAgICAgICAgICAgICMgU21hbGwgbmVnYXRpdmVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGlkeCA+IEBjZmcuX21heF96cHVuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICMgQmlnIHBvc2l0aXZlXG4gICAgICBSID0gZW5jb2RlIGlkeCwgQGNmZy5kaWdpdHNldFxuICAgICAgcmV0dXJuICggQGNmZy5fcG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgQGNmZy5jYXJkaW5hbHNfb25seVxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX181IHVuYWJsZSB0byBlbmNvZGUgbmVnYXRpdmUgaWR4ICN7aWR4fSB3aXRoIGNhcmRpbmFscy1vbmx5IGNvZGVjXCJcbiAgICBSID0gKCBlbmNvZGUgKCBpZHggKyBAY2ZnLl9tYXhfaW50ZWdlciAgICAgKSwgQGNmZy5kaWdpdHNldCApICAgICAgICAgICAjIEJpZyBuZWdhdGl2ZVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy5kaWdpdHNfcGVyX2lkeCB0aGVuIFIgPSBSLnBhZFN0YXJ0IEBjZmcuZGlnaXRzX3Blcl9pZHgsIEBjZmcuZGlnaXRzZXQuYXQgMFxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSID0gUi5yZXBsYWNlIEBjZmcuX2xlYWRpbmdfbm92YXNfcmUsICcnXG4gICAgcmV0dXJuICggQGNmZy5fbm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX3ZkeDogKCB2ZHggKSAtPiBAX2VuY29kZV92ZHggQHR5cGVzLnZkeC52YWxpZGF0ZSB2ZHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9lbmNvZGVfdmR4OiAoIHZkeCApIC0+IFxcXG4gICAgKCAoIEBlbmNvZGVfaWR4IGlkeCBmb3IgaWR4IGluIHZkeCApLmpvaW4gJycgKS5wYWRFbmQgQGNmZy5fc29ydGtleV93aWR0aCwgQGNmZy5fY2lwaGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwYXJzZTogKCBzb3J0a2V5ICkgLT5cbiAgICBSID0gW11cbiAgICBmb3IgbGV4ZW1lIGluIEBsZXhlci5zY2FuX3RvX2xpc3Qgc29ydGtleVxuICAgICAgeyBuYW1lLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZGF0YSwgICAgICAgfSA9IGxleGVtZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB7IGxldHRlcnMsXG4gICAgICAgIG1hbnRpc3NhLFxuICAgICAgICBpbmRleCwgICAgICB9ID0gZGF0YVxuICAgICAgbGV0dGVycyAgICAgICAgID0gbGV0dGVycy5qb2luICcnIGlmICggdHlwZV9vZiBsZXR0ZXJzICkgaXMgJ2xpc3QnXG4gICAgICBtYW50aXNzYSAgICAgICA/PSBudWxsXG4gICAgICBpbmRleCAgICAgICAgICA/PSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIucHVzaCB7IG5hbWUsIGxldHRlcnMsIG1hbnRpc3NhLCBpbmRleCwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGU6ICggc29ydGtleSApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzb3J0a2V5ICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzYgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3Mgc29ydGtleS5sZW5ndGggPiAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzcgZXhwZWN0ZWQgYSBub24tZW1wdHkgdGV4dCwgZ290ICN7cnByIHNvcnRrZXl9XCJcbiAgICBSID0gW11cbiAgICBmb3IgdW5pdCBpbiBAcGFyc2Ugc29ydGtleVxuICAgICAgaWYgdW5pdC5uYW1lIGlzICdvdGhlcidcbiAgICAgICAgbWVzc2FnZSAgID0gXCLOqWhsbF9fXzggbm90IGEgdmFsaWQgc29ydGtleTogdW5hYmxlIHRvIHBhcnNlICN7cnByIHVuaXQubGV0dGVyc31cIlxuICAgICAgICBtZXNzYWdlICArPSBcIiBpbiAje3JwciBzb3J0a2V5fVwiIGlmIHNvcnRrZXkgaXNudCB1bml0LmxldHRlcnNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIG1lc3NhZ2VcbiAgICAgIFIucHVzaCB1bml0LmluZGV4IGlmIHVuaXQuaW5kZXg/XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fOSBub3QgaW1wbGVtZW50ZWRcIlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaG9sbGVyaXRoXzEwICAgICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBcbiAgaG9sbGVyaXRoXzEwbXZwICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnAyXG4gIGhvbGxlcml0aF8xMF9jYXJkaW5hbCA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwX2NhcmRpbmFsXG4gIGhvbGxlcml0aF8xMjggICAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOFxuICBob2xsZXJpdGhfMTI4XzE2MzgzICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhfMTYzODNcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMF9jYXJkaW5hbCxcbiAgICBob2xsZXJpdGhfMTI4LFxuICAgIGhvbGxlcml0aF8xMjhfMTYzODMsXG4gICAgdGVzdCxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
