(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10_cardinal, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, hide, internals, log_to_base, regex, rpr, set_getter, test_hollerith, type_of;

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

  ({test_hollerith} = require('./test-hollerith'));

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
      /* Validations: */
      /* Derivations: */
      var R, hollerith_cfg_template, nmags, nuns, ref, types;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5,
        cardinals_only: false
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      types = new Hollerith_typespace({
        blank: R.blank
      });
      R.cardinals_only = types.cardinals_only.validate(R.cardinals_only);
      R.digitset = types.digitset.validate(R.digitset);
      R._digits_list = types.digitset.data._digits_list;
      R._naught = types.digitset.data._naught;
      R._nova = types.digitset.data._nova;
      R._leading_novas_re = types.digitset.data._leading_novas_re;
      R._base = types.digitset.data._base;
      R.magnifiers = types.magnifiers.validate(R.magnifiers, {
        cardinals_only: R.cardinals_only
      });
      R._pmag_list = types.magnifiers.data._pmag_list;
      R._nmag_list = types.magnifiers.data._nmag_list;
      R.uniliterals = types.uniliterals.validate(R.uniliterals, {
        cardinals_only: R.cardinals_only
      });
      R._cipher = types.uniliterals.data._cipher;
      R._nuns = types.uniliterals.data._nuns;
      R._zpuns = types.uniliterals.data._zpuns;
      R._nuns_list = types.uniliterals.data._nuns_list;
      R._zpuns_list = types.uniliterals.data._zpuns_list;
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
      R._alphabet = types._alphabet.validate((R.digitset + nmags + (nuns != null ? nuns : '') + R._zpuns + R._pmag).replace(types[CFG].blank_splitter, ''));
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
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_10_cardinal, hollerith_128, hollerith_128_16383, test_hollerith, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLHFCQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxtQkFBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsVUFBQSxFQUFBLGNBQUEsRUFBQSxPQUFBOzs7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsRUFDRSxLQURGLEVBRUUsTUFGRixDQUFBLEdBRTRCLE9BQUEsQ0FBUSxVQUFSLENBRjVCOztFQUdBLENBQUEsQ0FBRSxHQUFGLEVBQ0UsbUJBREYsQ0FBQSxHQUM0QixPQUFBLENBQVEsU0FBUixDQUQ1Qjs7RUFFQSxDQUFBLENBQUUsWUFBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW5CLENBQUEsQ0FBNUI7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QUxGO0FBTUEsYUFBTztJQWJELENBdkxWOzs7SUF1TUUsY0FBZ0IsQ0FBRSxDQUFGLENBQUE7TUFDZCxNQUFNLElBQUksS0FBSixDQUFVLDBCQUFWO0lBRFE7O0VBek1sQixFQXhHQTs7O0VBcVRBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQSxZQUFBLEVBQUEscUJBQUEsRUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUE7SUFBRSxZQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLFlBQWQ7SUFDeEIsZUFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxlQUFkO0lBQ3hCLGdCQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLGdCQUFkO0lBQ3hCLHFCQUFBLEdBQXdCLElBQUksU0FBSixDQUFjLHFCQUFkO0lBQ3hCLGFBQUEsR0FBd0IsSUFBSSxTQUFKLENBQWMsYUFBZDtJQUN4QixtQkFBQSxHQUF3QixJQUFJLFNBQUosQ0FBYyxtQkFBZDtBQUN4QixXQUFPLENBQ0wsU0FESyxFQUVMLFlBRkssRUFHTCxlQUhLLEVBSUwsZ0JBSkssRUFLTCxxQkFMSyxFQU1MLGFBTkssRUFPTCxtQkFQSyxFQVFMLGNBUkssRUFTTCxTQVRLO0VBUFcsQ0FBQTtBQXJUcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgR3JhbW1hclxuICBUb2tlblxuICBMZXhlbWUgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xueyBDRkcsXG4gIEhvbGxlcml0aF90eXBlc3BhY2UsICB9ID0gcmVxdWlyZSAnLi90eXBlcydcbnsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxueyBlbmNvZGUsXG4gIGRlY29kZSxcbiAgbG9nX3RvX2Jhc2UsXG4gIGdldF9yZXF1aXJlZF9kaWdpdHMsXG4gIGdldF9tYXhfaW50ZWdlciwgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG57IHRlc3RfaG9sbGVyaXRoLCAgICAgICB9ID0gcmVxdWlyZSAnLi90ZXN0LWhvbGxlcml0aCdcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjggPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIyMgICAgICAgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4XzE2MzgzID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgMlxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5Egw6Mgw6TDpcOmJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdOJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdKS0xNIE9QUVInXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cDIgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgICAgICAgIDNcbiAgZGlnaXRzX3Blcl9pZHg6ICAgICAzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwX2NhcmRpbmFsID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ0VGR0hJSktMTSBOIE9QUVJTVFVWVydcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnQUJDIFhZWidcbiAgY2FyZGluYWxzX29ubHk6ICAgICB0cnVlICMgbm9uZWdhdGl2ZXNcbiAgZGltZW5zaW9uOiAgICAgICAgICAzXG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgM1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMjhcbmNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbnRlcm5hbHMgPSBmcmVlemUge1xuICBjb25zdGFudHMsXG4gIGNvbnN0YW50c18xMjgsXG4gIGNvbnN0YW50c18xMjhfMTYzODMsXG4gIGNvbnN0YW50c18xMCxcbiAgY29uc3RhbnRzXzEwbXZwLFxuICBjb25zdGFudHNfMTBtdnAyLFxuICBjb25zdGFudHNfMTBfY2FyZGluYWwsXG4gIHR5cGVzOiAoIHJlcXVpcmUgJy4vdHlwZXMnICksIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICB7IGNmZyxcbiAgICAgIHR5cGVzLCAgICAgIH0gPSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGNmZyAgICAgICAgICAgID0gZnJlZXplIGNmZ1xuICAgIEBsZXhlciAgICAgICAgICA9IEBjb21waWxlX3NvcnRrZXlfbGV4ZXIgQGNmZ1xuICAgIGhpZGUgQCwgJ3R5cGVzJywgIHR5cGVzXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgICMjIyBWYWxpZGF0aW9uczogIyMjXG4gICAgIyMjIERlcml2YXRpb25zOiAjIyNcbiAgICBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlID1cbiAgICAgIGJsYW5rOiAgICAgICAgICAnXFx4MjAnXG4gICAgICBkaW1lbnNpb246ICAgICAgNVxuICAgICAgY2FyZGluYWxzX29ubHk6IGZhbHNlXG4gICAgUiAgICAgICAgICAgICAgICAgICAgID0gY2xlYW5fYXNzaWduIHt9LCBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlLCBjZmdcbiAgICB0eXBlcyAgICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSB7IGJsYW5rOiBSLmJsYW5rLCB9XG4gICAgUi5jYXJkaW5hbHNfb25seSAgICAgID0gdHlwZXMuY2FyZGluYWxzX29ubHkudmFsaWRhdGUgUi5jYXJkaW5hbHNfb25seVxuICAgIFIuZGlnaXRzZXQgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LnZhbGlkYXRlIFIuZGlnaXRzZXRcbiAgICBSLl9kaWdpdHNfbGlzdCAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9kaWdpdHNfbGlzdFxuICAgIFIuX25hdWdodCAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX25hdWdodFxuICAgIFIuX25vdmEgICAgICAgICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX25vdmFcbiAgICBSLl9sZWFkaW5nX25vdmFzX3JlICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9sZWFkaW5nX25vdmFzX3JlXG4gICAgUi5fYmFzZSAgICAgICAgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fYmFzZVxuICAgIFIubWFnbmlmaWVycyAgICAgICAgICA9IHR5cGVzLm1hZ25pZmllcnMudmFsaWRhdGUgUi5tYWduaWZpZXJzLCB7IGNhcmRpbmFsc19vbmx5OiBSLmNhcmRpbmFsc19vbmx5LCB9XG4gICAgUi5fcG1hZ19saXN0ICAgICAgICAgID0gdHlwZXMubWFnbmlmaWVycy5kYXRhLl9wbWFnX2xpc3RcbiAgICBSLl9ubWFnX2xpc3QgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLmRhdGEuX25tYWdfbGlzdFxuICAgIFIudW5pbGl0ZXJhbHMgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLnZhbGlkYXRlIFIudW5pbGl0ZXJhbHMsIHsgY2FyZGluYWxzX29ubHk6IFIuY2FyZGluYWxzX29ubHksIH1cbiAgICBSLl9jaXBoZXIgICAgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl9jaXBoZXJcbiAgICBSLl9udW5zICAgICAgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl9udW5zXG4gICAgUi5fenB1bnMgICAgICAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNcbiAgICBSLl9udW5zX2xpc3QgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl9udW5zX2xpc3RcbiAgICBSLl96cHVuc19saXN0ICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl96cHVuc19saXN0XG4gICAgaWYgUi5fY2lwaGVyIGlzbnQgUi5fenB1bnNfbGlzdFsgMCBdXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgaW50ZXJuYWwgZXJyb3I6IF9jaXBoZXIgI3tycHIgUi5fY2lwaGVyfSBkb2Vzbid0IG1hdGNoIF96cHVucyAje3JwciBSLl96cHVuc31cIlxuICAgIFIuX21pbl9udW4gICAgICAgICAgICA9IGlmIFIuX251bnNfbGlzdD8gdGhlbiAtUi5fbnVuc19saXN0Lmxlbmd0aCBlbHNlIDBcbiAgICBSLl9tYXhfenB1biAgICAgICAgICAgPSBSLl96cHVuc19saXN0Lmxlbmd0aCAtIDFcbiAgICBSLmRpbWVuc2lvbiAgICAgICAgICAgPSB0eXBlcy5kaW1lbnNpb24udmFsaWRhdGUgUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuZGlnaXRzX3Blcl9pZHggICAgID89IE1hdGgubWluICggUi5fcG1hZ19saXN0Lmxlbmd0aCAtIDEgKSwgKCBSLmRpZ2l0c19wZXJfaWR4ID8gSW5maW5pdHkgKVxuICAgIFIuZGlnaXRzX3Blcl9pZHggICAgICA9IHR5cGVzLmRpZ2l0c19wZXJfaWR4LnZhbGlkYXRlIFIuZGlnaXRzX3Blcl9pZHgsIFIuX3BtYWdfbGlzdFxuICAgIFIuX21heF9pbnRlZ2VyICAgICAgICA9IHR5cGVzLmNyZWF0ZV9tYXhfaW50ZWdlciB7IF9iYXNlOiBSLl9iYXNlLCBkaWdpdHNfcGVyX2lkeDogUi5kaWdpdHNfcGVyX2lkeCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdW5sZXNzIFIuY2FyZGluYWxzX29ubHlcbiAgICAgIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPCBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMiBkaWdpdHNfcGVyX2lkeCBpcyAje1IuZGlnaXRzX3Blcl9pZHh9LCBidXQgdGhlcmUgYXJlIG9ubHkgI3tSLl9ubWFnX2xpc3QubGVuZ3RofSBwb3NpdGl2ZSBtYWduaWZpZXJzXCJcbiAgICAgIGVsc2UgaWYgUi5fbm1hZ19saXN0Lmxlbmd0aCA+IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgICAgUi5fbm1hZ19saXN0ID0gZnJlZXplIFIuX25tYWdfbGlzdFsgLi4gUi5kaWdpdHNfcGVyX2lkeCBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBSLl9wbWFnX2xpc3QubGVuZ3RoIDwgUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18zIGRpZ2l0c19wZXJfaWR4IGlzICN7Ui5kaWdpdHNfcGVyX2lkeH0sIGJ1dCB0aGVyZSBhcmUgb25seSAje1IuX3BtYWdfbGlzdC5sZW5ndGh9IHBvc2l0aXZlIG1hZ25pZmllcnNcIlxuICAgIGVsc2UgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA+IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgIFIuX3BtYWdfbGlzdCA9IGZyZWV6ZSBSLl9wbWFnX2xpc3RbIC4uIFIuZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5fcG1hZyAgICAgICAgICAgICAgID0gUi5fcG1hZ19saXN0LmpvaW4gJydcbiAgICBSLl9ubWFnICAgICAgICAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gbnVsbCBlbHNlIFIuX25tYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbWF4X2lkeF93aWR0aCAgICAgID0gUi5kaWdpdHNfcGVyX2lkeCArIDFcbiAgICBSLl9zb3J0a2V5X3dpZHRoICAgICAgPSBSLl9tYXhfaWR4X3dpZHRoICogUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX21pbl9pbnRlZ2VyICAgICAgICA9IGlmIFIuY2FyZGluYWxzX29ubHkgdGhlbiAwIGVsc2UgLVIuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgVEFJTlQgdGhpcyBjYW4gYmUgZ3JlYXRseSBzaW1wbGlmaWVkIHdpdGggVG8gRG9zIGltcGxlbWVudGVkICMjI1xuICAgICMjIyBUQUlOVCB3aGlsZSB0cmVhdG1lbnQgb2YgTlVOcywgWlBVTnMgaXMgdW5zYXRpc2ZhY3RvcnkgdGhleSdyZSBzY2hlZHVsZWQgdG8gYmUgcmVtb3ZlZCBhbnl3YXlzIHNvXG4gICAgICAgIHdlIHJlZnJhaW4gZnJvbSBpbXByb3ZpbmcgdGhhdCAjIyNcbiAgICBubWFncyAgICAgICAgICAgICAgICAgPSBpZiBSLmNhcmRpbmFsc19vbmx5IHRoZW4gJycgZWxzZSBbIFIuX25tYWdfbGlzdC4uLiwgXS5yZXZlcnNlKCkuam9pbiAnJ1xuICAgIG51bnMgICAgICAgICAgICAgICAgICA9IGlmIFIuY2FyZGluYWxzX29ubHkgdGhlbiAnJyBlbHNlIFIuX251bnNcbiAgICBSLl9hbHBoYWJldCAgICAgICAgICAgPSB0eXBlcy5fYWxwaGFiZXQudmFsaWRhdGUgKCBSLmRpZ2l0c2V0ICsgXFxcbiAgICAgIG5tYWdzICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgKCBudW5zID8gJycgKSAgICAgICAgICAgICArIFxcXG4gICAgICBSLl96cHVucyAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIuX3BtYWcgICAgICAgICAgICAgICAgICAgICApLnJlcGxhY2UgdHlwZXNbQ0ZHXS5ibGFua19zcGxpdHRlciwgJydcbiAgICByZXR1cm4geyBjZmc6IFIsIHR5cGVzLCB9XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb21waWxlX3NvcnRrZXlfbGV4ZXI6ICggY2ZnICkgLT5cbiAgICB7IF9udW5zLFxuICAgICAgX3pwdW5zLFxuICAgICAgX25tYWcsXG4gICAgICBfcG1hZyxcbiAgICAgIGRpZ2l0c2V0LCAgICAgfSA9IGNmZ1xuICAgICMgX2Jhc2UgICAgICAgICAgICAgID0gZGlnaXRzZXQubGVuZ3RoXG4gICAgaW5jbHVkZV9uZWdhdGl2ZXMgPSBub3QgY2ZnLmNhcmRpbmFsc19vbmx5XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBwdW5zX2xldHRlcnMgID0gX3pwdW5zWyAgMSAuLiAgXVxuICAgIHBtYWdfbGV0dGVycyAgPSBfcG1hZ1sgICAxIC4uICBdXG4gICAgemVyb19sZXR0ZXJzICA9IF96cHVuc1sgIDAgICAgIF1cbiAgICBtYXhfZGlnaXQgICAgID0gZGlnaXRzZXQuYXQgLTFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZpdF9wdW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3B1bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9wbnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3BtYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2RpZ2l0c2V0fSAgXSogKSBcIlxuICAgIGZpdF9wYWRkaW5nICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSsgKSAkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF96ZXJvICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSAgKD89IC4qIFteICN7emVyb19sZXR0ZXJzfSBdICkgKSAgICAgXCJcbiAgICBmaXRfb3RoZXIgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IC4gICAgICAgICAgICAgICAgICAgICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBhbGxfemVyb19yZSAgID0gcmVnZXhcIl4gI3t6ZXJvX2xldHRlcnN9KyAkXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNhc3RfcHVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gK2NmZy5fenB1bnMuaW5kZXhPZiAgZC5sZXR0ZXJzXG4gICAgY2FzdF9wbnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSBkZWNvZGUgZC5tYW50aXNzYSwgZGlnaXRzZXRcbiAgICBjYXN0X3plcm8gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IDBcbiAgICBjYXN0X3BhZGRpbmcgID0gKHsgZGF0YTogZCwgc291cmNlLCBoaXQsIH0pIC0+IGQuaW5kZXggPSAwIGlmIHNvdXJjZSBpcyBoaXRcbiAgICBjYXN0X290aGVyICAgID0gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgaW5jbHVkZV9uZWdhdGl2ZXNcbiAgICAgIG51bnNfbGV0dGVycyAgPSBfbnVuc1xuICAgICAgbm1hZ19sZXR0ZXJzICA9IF9ubWFnWyAgIDEgLi4gIF1cbiAgICAgIGZpdF9udW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje251bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgICAgZml0X25udW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bm1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7ZGlnaXRzZXR9ICBdKiApIFwiXG4gICAgICBjYXN0X251biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICggY2ZnLl9udW5zLmluZGV4T2YgZC5sZXR0ZXJzICkgLSBjZmcuX251bnMubGVuZ3RoXG4gICAgICBjYXN0X25udW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT5cbiAgICAgICAgbWFudGlzc2EgID0gZC5tYW50aXNzYS5wYWRTdGFydCBjZmcuZGlnaXRzX3Blcl9pZHgsIG1heF9kaWdpdFxuICAgICAgICBkLmluZGV4ICAgPSAoIGRlY29kZSBtYW50aXNzYSwgZGlnaXRzZXQgKSAtIGNmZy5fbWF4X2ludGVnZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgICAgPSBuZXcgR3JhbW1hciB7IGVtaXRfc2lnbmFsczogZmFsc2UsIH1cbiAgICBmaXJzdCAgICAgICAgID0gUi5uZXdfbGV2ZWwgeyBuYW1lOiAnZmlyc3QnLCB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbnVuJywgICAgICBmaXQ6IGZpdF9udW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9udW4sICAgICAgfSBpZiBpbmNsdWRlX25lZ2F0aXZlc1xuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3B1bicsICAgICAgZml0OiBmaXRfcHVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcHVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdubnVtJywgICAgIGZpdDogZml0X25udW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X25udW0sICAgICB9IGlmIGluY2x1ZGVfbmVnYXRpdmVzXG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncG51bScsICAgICBmaXQ6IGZpdF9wbnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wbnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BhZGRpbmcnLCAgZml0OiBmaXRfcGFkZGluZywgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcGFkZGluZywgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICd6ZXJvJywgICAgIGZpdDogZml0X3plcm8sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3plcm8sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnb3RoZXInLCAgICBmaXQ6IGZpdF9vdGhlciwgbWVyZ2U6ICdsaXN0JywgY2FzdDogY2FzdF9vdGhlciwgICAgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZTogKCBpZHhfb3JfdmR4ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIEB0eXBlcy5pZHhfb3JfdmR4LnZhbGlkYXRlIGlkeF9vcl92ZHhcbiAgICBzd2l0Y2ggdHlwZSA9IEB0eXBlcy5pZHhfb3JfdmR4LmRhdGEudHlwZVxuICAgICAgd2hlbiAnaWR4JyB0aGVuIHJldHVybiBAZW5jb2RlX2lkeCAgaWR4X29yX3ZkeFxuICAgICAgd2hlbiAndmR4JyB0aGVuIHJldHVybiBAX2VuY29kZV92ZHggaWR4X29yX3ZkeFxuICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNCBpbnRlcm5hbCBlcnJvcjogdW5rbm93biB0eXBlICN7cnByIHR5cGV9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV9pZHg6ICggaWR4ICkgLT4gQF9lbmNvZGVfaWR4IEB0eXBlcy5pZHgudmFsaWRhdGUgaWR4LCBAY2ZnLl9taW5faW50ZWdlciwgQGNmZy5fbWF4X2ludGVnZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9lbmNvZGVfaWR4OiAoIGlkeCApIC0+XG4gICAgIyMjIE5PVEUgY2FsbCBvbmx5IHdoZXJlIGFzc3VyZWQgYGlkeGAgaXMgaW50ZWdlciB3aXRoaW4gbWFnbml0dWRlIG9mIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAgIyMjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gKCBAY2ZnLl96cHVucy5hdCBpZHggKSBpZiAwICAgICAgICAgICAgICA8PSBpZHggPD0gQGNmZy5fbWF4X3pwdW4gICMgWmVybyBvciBzbWFsbCBwb3NpdGl2ZVxuICAgIHJldHVybiAoIEBjZmcuX251bnMuYXQgIGlkeCApIGlmIEBjZmcuX21pbl9udW4gIDw9IGlkeCA8ICAwICAgICAgICAgICAgICAgIyBTbWFsbCBuZWdhdGl2ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgaWR4ID4gQGNmZy5fbWF4X3pwdW4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBCaWcgcG9zaXRpdmVcbiAgICAgIFIgPSBlbmNvZGUgaWR4LCBAY2ZnLmRpZ2l0c2V0XG4gICAgICByZXR1cm4gKCBAY2ZnLl9wbWFnLmF0IFIubGVuZ3RoICkgKyBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBAY2ZnLmNhcmRpbmFsc19vbmx5XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzUgdW5hYmxlIHRvIGVuY29kZSBuZWdhdGl2ZSBpZHggI3tpZHh9IHdpdGggY2FyZGluYWxzLW9ubHkgY29kZWNcIlxuICAgIFIgPSAoIGVuY29kZSAoIGlkeCArIEBjZmcuX21heF9pbnRlZ2VyICAgICApLCBAY2ZnLmRpZ2l0c2V0ICkgICAgICAgICAgICMgQmlnIG5lZ2F0aXZlXG4gICAgaWYgUi5sZW5ndGggPCBAY2ZnLmRpZ2l0c19wZXJfaWR4IHRoZW4gUiA9IFIucGFkU3RhcnQgQGNmZy5kaWdpdHNfcGVyX2lkeCwgQGNmZy5kaWdpdHNldC5hdCAwXG4gICAgZWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBSLnJlcGxhY2UgQGNmZy5fbGVhZGluZ19ub3Zhc19yZSwgJydcbiAgICByZXR1cm4gKCBAY2ZnLl9ubWFnLmF0IFIubGVuZ3RoICkgKyBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfdmR4OiAoIHZkeCApIC0+IEBfZW5jb2RlX3ZkeCBAdHlwZXMudmR4LnZhbGlkYXRlIHZkeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgX2VuY29kZV92ZHg6ICggdmR4ICkgLT4gXFxcbiAgICAoICggQGVuY29kZV9pZHggaWR4IGZvciBpZHggaW4gdmR4ICkuam9pbiAnJyApLnBhZEVuZCBAY2ZnLl9zb3J0a2V5X3dpZHRoLCBAY2ZnLl9jaXBoZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHBhcnNlOiAoIHNvcnRrZXkgKSAtPlxuICAgIFIgPSBbXVxuICAgIGZvciBsZXhlbWUgaW4gQGxleGVyLnNjYW5fdG9fbGlzdCBzb3J0a2V5XG4gICAgICB7IG5hbWUsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBzdG9wLFxuICAgICAgICBkYXRhLCAgICAgICB9ID0gbGV4ZW1lXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHsgbGV0dGVycyxcbiAgICAgICAgbWFudGlzc2EsXG4gICAgICAgIGluZGV4LCAgICAgIH0gPSBkYXRhXG4gICAgICBsZXR0ZXJzICAgICAgICAgPSBsZXR0ZXJzLmpvaW4gJycgaWYgKCB0eXBlX29mIGxldHRlcnMgKSBpcyAnbGlzdCdcbiAgICAgIG1hbnRpc3NhICAgICAgID89IG51bGxcbiAgICAgIGluZGV4ICAgICAgICAgID89IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5wdXNoIHsgbmFtZSwgbGV0dGVycywgbWFudGlzc2EsIGluZGV4LCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZTogKCBzb3J0a2V5ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNvcnRrZXkgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNiBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBzb3J0a2V5Lmxlbmd0aCA+IDBcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNyBleHBlY3RlZCBhIG5vbi1lbXB0eSB0ZXh0LCBnb3QgI3tycHIgc29ydGtleX1cIlxuICAgIFIgPSBbXVxuICAgIGZvciB1bml0IGluIEBwYXJzZSBzb3J0a2V5XG4gICAgICBpZiB1bml0Lm5hbWUgaXMgJ290aGVyJ1xuICAgICAgICBtZXNzYWdlICAgPSBcIs6paGxsX19fOCBub3QgYSB2YWxpZCBzb3J0a2V5OiB1bmFibGUgdG8gcGFyc2UgI3tycHIgdW5pdC5sZXR0ZXJzfVwiXG4gICAgICAgIG1lc3NhZ2UgICs9IFwiIGluICN7cnByIHNvcnRrZXl9XCIgaWYgc29ydGtleSBpc250IHVuaXQubGV0dGVyc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgbWVzc2FnZVxuICAgICAgUi5wdXNoIHVuaXQuaW5kZXggaWYgdW5pdC5pbmRleD9cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX185IG5vdCBpbXBsZW1lbnRlZFwiXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBob2xsZXJpdGhfMTAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMFxuICBob2xsZXJpdGhfMTBtdnAgICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cFxuICBob2xsZXJpdGhfMTBtdnAyICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cDJcbiAgaG9sbGVyaXRoXzEwX2NhcmRpbmFsID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBfY2FyZGluYWxcbiAgaG9sbGVyaXRoXzEyOCAgICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XG4gIGhvbGxlcml0aF8xMjhfMTYzODMgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOF8xNjM4M1xuICByZXR1cm4ge1xuICAgIEhvbGxlcml0aCxcbiAgICBob2xsZXJpdGhfMTAsXG4gICAgaG9sbGVyaXRoXzEwbXZwLFxuICAgIGhvbGxlcml0aF8xMG12cDIsXG4gICAgaG9sbGVyaXRoXzEwX2NhcmRpbmFsLFxuICAgIGhvbGxlcml0aF8xMjgsXG4gICAgaG9sbGVyaXRoXzEyOF8xNjM4MyxcbiAgICB0ZXN0X2hvbGxlcml0aCxcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
