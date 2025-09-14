(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, internals, log_to_base, regex, rpr, type_of, types;

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

  types = require('./types');

  ({CFG, Hollerith_typespace} = types);

  ({clean_assign} = SFMODULES.unstable.require_clean_assign());

  ({encode, decode, log_to_base, get_required_digits, get_max_integer} = SFMODULES.unstable.require_anybase());

  ({freeze} = Object);

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    // zpun_max:     +20
    // nun_min:      -20
    // _max_digits_per_idx: 8
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_128_16383 = freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    _max_digits_per_idx: 2,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5,
    _max_integer: (128 ** 2) - 1 // 16383
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10 = freeze({
    uniliterals: 'ÏÐÑ ã äåæ',
    zpun_max: +3,
    nun_min: -3,
    _max_digits_per_idx: 3,
    alphabet: '0123456789',
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = freeze({
    uniliterals: 'N',
    zpun_max: +0,
    nun_min: -0,
    _max_digits_per_idx: 3,
    alphabet: '0123456789',
    magnifiers: 'JKLM OPQR',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    zpun_max: +9,
    nun_min: -9,
    _max_digits_per_idx: 3,
    alphabet: '0123456789',
    magnifiers: 'ABC XYZ',
    dimension: 3,
    _max_integer: 999
  });

  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = freeze({constants, types});

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var clasz;
      clasz = this.constructor;
      this.cfg = freeze(clasz.validate_and_compile_cfg(cfg));
      this.lexer = this.compile_sortkey_lexer(this.cfg);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static validate_and_compile_cfg(cfg) {
      /* Validations: */
      /* Derivations: */
      var R, T, _max_digits_per_idx, hollerith_cfg_template, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.alphabet = T.alphabet.validate(cfg.alphabet);
      R.alphabet_chrs = T.alphabet.data.alphabet_chrs;
      R._naught = T.alphabet.data._naught;
      R._nova = T.alphabet.data._nova;
      R.leading_niners_re = T.alphabet.data.leading_niners_re;
      R.base = T.alphabet.data.base;
      R.magnifiers = T.magnifiers.validate(cfg.magnifiers);
      R.pmag_chrs = T.magnifiers.data.pmag_chrs;
      R.nmag_chrs = T.magnifiers.data.nmag_chrs;
      R.uniliterals = T.uniliterals.validate(cfg.uniliterals);
      R._cipher = T.uniliterals.data._cipher;
      R.nuns = T.uniliterals.data.nuns;
      R.zpuns = T.uniliterals.data.zpuns;
      R.nun_chrs = T.uniliterals.data.nun_chrs;
      R.zpun_chrs = T.uniliterals.data.zpun_chrs;
      R.nun_min = -R.nun_chrs.length;
      R.zpun_max = R.zpun_chrs.length - 1;
      R.dimension = T.dimension.validate(cfg.dimension);
      //.......................................................................................................
      _max_digits_per_idx = Math.min(R.pmag_chrs.length - 1, (ref = cfg._max_digits_per_idx) != null ? ref : 2e308);
      R._max_digits_per_idx = T._max_digits_per_idx_$.validate(_max_digits_per_idx, R.pmag_chrs);
      //.......................................................................................................
      if (cfg._max_integer != null) {
        R._max_integer = T._max_integer_$.validate(cfg._max_integer, R.base);
      } else {
        R._max_integer = T.create_max_integer_$({
          base: R.base,
          digits_numof: R._max_digits_per_idx
        });
      }
      //.......................................................................................................
      if (R.nmag_chrs.length < R._max_digits_per_idx) {
        throw new Error(`Ωhll___1 _max_digits_per_idx is ${R._max_digits_per_idx}, but there are only ${R.nmag_chrs.length} positive magnifiers`);
      } else if (R.nmag_chrs.length > R._max_digits_per_idx) {
        R.nmag_chrs = freeze(R.nmag_chrs.slice(0, +R._max_digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      if (R.pmag_chrs.length < R._max_digits_per_idx) {
        throw new Error(`Ωhll___3 _max_digits_per_idx is ${R._max_digits_per_idx}, but there are only ${R.pmag_chrs.length} positive magnifiers`);
      } else if (R.pmag_chrs.length > R._max_digits_per_idx) {
        R.pmag_chrs = freeze(R.pmag_chrs.slice(0, +R._max_digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      R.pmag = R.pmag_chrs.join('');
      R.nmag = R.nmag_chrs.join('');
      R._max_idx_width = R._max_digits_per_idx + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      R.TMP_alphabet = T.TMP_alphabet.validate((R.alphabet + ([...R.nmag_chrs].reverse().join('')) + R.nuns + R.zpuns + R.pmag).replace(T[CFG].blank_splitter, ''));
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, all_zero_re, alphabet, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, max_digit, nmag, nmag_letters, nuns, nuns_letters, pmag, pmag_letters, puns_letters, zero_letters, zpuns;
      ({nuns, zpuns, nmag, pmag, alphabet} = cfg);
      // base              = alphabet.length
      //.......................................................................................................
      nuns_letters = nuns;
      puns_letters = zpuns.slice(1);
      nmag_letters = nmag.slice(1);
      pmag_letters = pmag.slice(1);
      zero_letters = zpuns[0];
      max_digit = alphabet.at(-1);
      //.......................................................................................................
      fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${alphabet}  ]* ) `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${alphabet}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.......................................................................................................
      cast_nun = function({
          data: d
        }) {
        return d.index = (cfg.nuns.indexOf(d.letters)) - cfg.nuns.length;
      };
      cast_pun = function({
          data: d
        }) {
        return d.index = +cfg.zpuns.indexOf(d.letters);
      };
      cast_nnum = function({
          data: d
        }) {
        var mantissa;
        mantissa = d.mantissa.padStart(cfg._max_digits_per_idx, max_digit);
        return d.index = (decode(mantissa, alphabet)) - cfg._max_integer;
      };
      cast_pnum = function({
          data: d
        }) {
        return d.index = decode(d.mantissa, alphabet);
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
      R = new Grammar({
        emit_signals: false
      });
      first = R.new_level({
        name: 'first'
      });
      first.new_token({
        name: 'nun',
        fit: fit_nun,
        cast: cast_nun
      });
      first.new_token({
        name: 'pun',
        fit: fit_pun,
        cast: cast_pun
      });
      first.new_token({
        name: 'nnum',
        fit: fit_nnum,
        cast: cast_nnum
      });
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
    encode(integer_or_list) {
      var n, type;
      /* TAINT use proper validation */
      if (Array.isArray(integer_or_list)) {
        return ((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = integer_or_list.length; i < len; i++) {
            n = integer_or_list[i];
            results.push(this.encode(n));
          }
          return results;
        }).call(this)).join('');
      }
      //.......................................................................................................
      n = integer_or_list;
      if (!Number.isFinite(n)) {
        type = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        throw new Error(`Ωhll___4 expected a float, got a ${type}`);
      }
      if (!((this.cfg._min_integer <= n && n <= this.cfg._max_integer))) {
        throw new Error(`Ωhll___5 expected a float between ${this.cfg._min_integer} and ${this.cfg._max_integer}, got ${n}`);
      }
      //.......................................................................................................
      return this.encode_integer(n);
    }

    //---------------------------------------------------------------------------------------------------------
    encode_integer(n) {
      var R;
      if ((0 <= n && n <= this.cfg.zpun_max)) {
        /* NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        // Zero or small positive:
        return this.cfg.zpuns.at(n);
      }
      if ((this.cfg.nun_min <= n && n < 0)) {
        //.......................................................................................................
        // Small negative:
        return this.cfg.nuns.at(n);
      }
      //.......................................................................................................
      // Big positive:
      if (n > this.cfg.zpun_max) {
        R = encode(n, this.cfg.alphabet);
        return (this.cfg.pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      // Big negative:
      /* NOTE plus one or not plus one?? */
      // R = ( encode ( n + @cfg._max_integer + 1 ), @cfg.alphabet )
      R = encode(n + this.cfg._max_integer, this.cfg.alphabet);
      if (R.length < this.cfg._max_digits_per_idx) {
        R = R.padStart(this.cfg._max_digits_per_idx, this.cfg.alphabet.at(0));
      } else {
        R = R.replace(this.cfg.leading_niners_re, '');
      }
      return (this.cfg.nmag.at(R.length)) + R;
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
        throw new Error(`Ωhll___9 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll__10 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll__11 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
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
      throw new Error("Ωhll__12 not implemented");
    }

  };

  //===========================================================================================================
  module.exports = (() => {
    var hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128_16383 = new Hollerith(constants_128_16383);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Ozs7O0VBS0EsU0FBQSxHQUE0QixPQUFBLENBQVEsK0JBQVI7O0VBQzVCLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUE7SUFBRSxjQUFBLEVBQWdCO0VBQWxCLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsT0FBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixFQUNFLEtBREYsRUFFRSxNQUZGLENBQUEsR0FFNEIsT0FBQSxDQUFRLFVBQVIsQ0FGNUI7O0VBR0EsS0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsQ0FBQSxDQUFFLEdBQUYsRUFDRSxtQkFERixDQUFBLEdBQzRCLEtBRDVCOztFQUVBLENBQUEsQ0FBRSxZQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxvQkFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENB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YyxtQkFBZDtBQUN0QixXQUFPLENBQ0wsU0FESyxFQUVMLFlBRkssRUFHTCxlQUhLLEVBSUwsZ0JBSkssRUFLTCxhQUxLLEVBTUwsbUJBTkssRUFPTCxTQVBLO0VBTlcsQ0FBQTtBQXJTcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgR3JhbW1hclxuICBUb2tlblxuICBMZXhlbWUgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xudHlwZXMgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vdHlwZXMnXG57IENGRyxcbiAgSG9sbGVyaXRoX3R5cGVzcGFjZSwgIH0gPSB0eXBlc1xueyBjbGVhbl9hc3NpZ24sICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG57IGVuY29kZSxcbiAgZGVjb2RlLFxuICBsb2dfdG9fYmFzZSxcbiAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiAgZ2V0X21heF9pbnRlZ2VyLCAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9hbnliYXNlKClcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjggPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIHpwdW5fbWF4OiAgICAgKzIwXG4gICMgbnVuX21pbjogICAgICAtMjBcbiAgIyBfbWF4X2RpZ2l0c19wZXJfaWR4OiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjhfMTYzODMgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICBfbWF4X2RpZ2l0c19wZXJfaWR4OiAyXG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuICBfbWF4X2ludGVnZXI6ICggMTI4ICoqIDIgKSAtIDEgIyAxNjM4M1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICfDj8OQw5Egw6Mgw6TDpcOmJ1xuICB6cHVuX21heDogICAgICszXG4gIG51bl9taW46ICAgICAgLTNcbiAgX21heF9kaWdpdHNfcGVyX2lkeDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnTidcbiAgenB1bl9tYXg6ICAgICArMFxuICBudW5fbWluOiAgICAgIC0wXG4gIF9tYXhfZGlnaXRzX3Blcl9pZHg6ICAzXG4gIGFscGhhYmV0OiAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgJ0pLTE0gT1BRUidcbiAgZGltZW5zaW9uOiAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICdFRkdISUpLTE0gTiBPUFFSU1RVVlcnXG4gIHpwdW5fbWF4OiAgICAgKzlcbiAgbnVuX21pbjogICAgICAtOVxuICBfbWF4X2RpZ2l0c19wZXJfaWR4OiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgIDNcbiAgX21heF9pbnRlZ2VyOiA5OTlcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTI4XG5jb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEwXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaW50ZXJuYWxzID0gZnJlZXplIHsgY29uc3RhbnRzLCB0eXBlcywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgSG9sbGVyaXRoXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIEBjZmcgICAgICAgICAgICA9IGZyZWV6ZSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGxleGVyICAgICAgICAgID0gQGNvbXBpbGVfc29ydGtleV9sZXhlciBAY2ZnXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgICMjIyBWYWxpZGF0aW9uczogIyMjXG4gICAgIyMjIERlcml2YXRpb25zOiAjIyNcbiAgICBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlID1cbiAgICAgIGJsYW5rOiAgICAgICAgJ1xceDIwJ1xuICAgICAgZGltZW5zaW9uOiAgIDVcbiAgICBSICAgICAgICAgICAgICAgICAgICAgPSBjbGVhbl9hc3NpZ24ge30sIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUsIGNmZ1xuICAgIFQgICAgICAgICAgICAgICAgICAgICA9IG5ldyBIb2xsZXJpdGhfdHlwZXNwYWNlIHsgYmxhbms6IFIuYmxhbmssIH1cbiAgICBSLmFscGhhYmV0ICAgICAgICAgICAgPSBULmFscGhhYmV0LnZhbGlkYXRlIGNmZy5hbHBoYWJldFxuICAgIFIuYWxwaGFiZXRfY2hycyAgICAgICA9IFQuYWxwaGFiZXQuZGF0YS5hbHBoYWJldF9jaHJzXG4gICAgUi5fbmF1Z2h0ICAgICAgICAgICAgID0gVC5hbHBoYWJldC5kYXRhLl9uYXVnaHRcbiAgICBSLl9ub3ZhICAgICAgICAgICAgICAgPSBULmFscGhhYmV0LmRhdGEuX25vdmFcbiAgICBSLmxlYWRpbmdfbmluZXJzX3JlICAgPSBULmFscGhhYmV0LmRhdGEubGVhZGluZ19uaW5lcnNfcmVcbiAgICBSLmJhc2UgICAgICAgICAgICAgICAgPSBULmFscGhhYmV0LmRhdGEuYmFzZVxuICAgIFIubWFnbmlmaWVycyAgICAgICAgICA9IFQubWFnbmlmaWVycy52YWxpZGF0ZSBjZmcubWFnbmlmaWVyc1xuICAgIFIucG1hZ19jaHJzICAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLnBtYWdfY2hyc1xuICAgIFIubm1hZ19jaHJzICAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLm5tYWdfY2hyc1xuICAgIFIudW5pbGl0ZXJhbHMgICAgICAgICA9IFQudW5pbGl0ZXJhbHMudmFsaWRhdGUgY2ZnLnVuaWxpdGVyYWxzXG4gICAgUi5fY2lwaGVyICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLl9jaXBoZXJcbiAgICBSLm51bnMgICAgICAgICAgICAgICAgPSBULnVuaWxpdGVyYWxzLmRhdGEubnVuc1xuICAgIFIuenB1bnMgICAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS56cHVuc1xuICAgIFIubnVuX2NocnMgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5udW5fY2hyc1xuICAgIFIuenB1bl9jaHJzICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS56cHVuX2NocnNcbiAgICBSLm51bl9taW4gICAgICAgICAgICAgPSAtUi5udW5fY2hycy5sZW5ndGhcbiAgICBSLnpwdW5fbWF4ICAgICAgICAgICAgPSBSLnpwdW5fY2hycy5sZW5ndGggLSAxXG4gICAgUi5kaW1lbnNpb24gICAgICAgICAgID0gVC5kaW1lbnNpb24udmFsaWRhdGUgY2ZnLmRpbWVuc2lvblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgX21heF9kaWdpdHNfcGVyX2lkeCAgID0gTWF0aC5taW4gKCBSLnBtYWdfY2hycy5sZW5ndGggLSAxICksICggY2ZnLl9tYXhfZGlnaXRzX3Blcl9pZHggPyBJbmZpbml0eSApXG4gICAgUi5fbWF4X2RpZ2l0c19wZXJfaWR4ID0gVC5fbWF4X2RpZ2l0c19wZXJfaWR4XyQudmFsaWRhdGUgX21heF9kaWdpdHNfcGVyX2lkeCwgUi5wbWFnX2NocnNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIGNmZy5fbWF4X2ludGVnZXI/ICB0aGVuICBSLl9tYXhfaW50ZWdlciAgPSBULl9tYXhfaW50ZWdlcl8kLnZhbGlkYXRlIGNmZy5fbWF4X2ludGVnZXIsIFIuYmFzZVxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICBSLl9tYXhfaW50ZWdlciAgPSBULmNyZWF0ZV9tYXhfaW50ZWdlcl8kIHsgYmFzZTogUi5iYXNlLCBkaWdpdHNfbnVtb2Y6IFIuX21heF9kaWdpdHNfcGVyX2lkeCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5ubWFnX2NocnMubGVuZ3RoIDwgUi5fbWF4X2RpZ2l0c19wZXJfaWR4XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgX21heF9kaWdpdHNfcGVyX2lkeCBpcyAje1IuX21heF9kaWdpdHNfcGVyX2lkeH0sIGJ1dCB0aGVyZSBhcmUgb25seSAje1Iubm1hZ19jaHJzLmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLm5tYWdfY2hycy5sZW5ndGggPiBSLl9tYXhfZGlnaXRzX3Blcl9pZHhcbiAgICAgIFIubm1hZ19jaHJzID0gZnJlZXplIFIubm1hZ19jaHJzWyAuLiBSLl9tYXhfZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5wbWFnX2NocnMubGVuZ3RoIDwgUi5fbWF4X2RpZ2l0c19wZXJfaWR4XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzMgX21heF9kaWdpdHNfcGVyX2lkeCBpcyAje1IuX21heF9kaWdpdHNfcGVyX2lkeH0sIGJ1dCB0aGVyZSBhcmUgb25seSAje1IucG1hZ19jaHJzLmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLnBtYWdfY2hycy5sZW5ndGggPiBSLl9tYXhfZGlnaXRzX3Blcl9pZHhcbiAgICAgIFIucG1hZ19jaHJzID0gZnJlZXplIFIucG1hZ19jaHJzWyAuLiBSLl9tYXhfZGlnaXRzX3Blcl9pZHggXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5wbWFnICAgICAgICAgICAgICAgID0gUi5wbWFnX2NocnMuam9pbiAnJ1xuICAgIFIubm1hZyAgICAgICAgICAgICAgICA9IFIubm1hZ19jaHJzLmpvaW4gJydcbiAgICBSLl9tYXhfaWR4X3dpZHRoICAgICAgPSBSLl9tYXhfZGlnaXRzX3Blcl9pZHggKyAxXG4gICAgUi5fc29ydGtleV93aWR0aCAgICAgID0gUi5fbWF4X2lkeF93aWR0aCAqIFIuZGltZW5zaW9uXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9taW5faW50ZWdlciAgICAgICAgPSAtUi5fbWF4X2ludGVnZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBUQUlOVCB0aGlzIGNhbiBiZSBncmVhdGx5IHNpbXBsaWZpZWQgd2l0aCBUbyBEb3MgaW1wbGVtZW50ZWQgIyMjXG4gICAgUi5UTVBfYWxwaGFiZXQgID0gVC5UTVBfYWxwaGFiZXQudmFsaWRhdGUgKCBSLmFscGhhYmV0ICsgKCBcXFxuICAgICAgWyBSLm5tYWdfY2hycy4uLiwgXS5yZXZlcnNlKCkuam9pbiAnJyApICsgXFxcbiAgICAgIFIubnVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLnpwdW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5wbWFnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5yZXBsYWNlIFRbQ0ZHXS5ibGFua19zcGxpdHRlciwgJydcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBudW5zLFxuICAgICAgenB1bnMsXG4gICAgICBubWFnLFxuICAgICAgcG1hZyxcbiAgICAgIGFscGhhYmV0LCAgICAgfSA9IGNmZ1xuICAgICMgYmFzZSAgICAgICAgICAgICAgPSBhbHBoYWJldC5sZW5ndGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG51bnNfbGV0dGVycyAgPSBudW5zXG4gICAgcHVuc19sZXR0ZXJzICA9IHpwdW5zWyAgMSAuLiAgXVxuICAgIG5tYWdfbGV0dGVycyAgPSBubWFnWyAgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gcG1hZ1sgICAxIC4uICBdXG4gICAgemVyb19sZXR0ZXJzICA9IHpwdW5zWyAgMCAgICAgXVxuICAgIG1heF9kaWdpdCAgICAgPSBhbHBoYWJldC5hdCAtMVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZml0X251biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bnVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3B1biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cHVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X25udW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bm1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7YWxwaGFiZXR9ICBdKiApIFwiXG4gICAgZml0X3BudW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cG1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7YWxwaGFiZXR9ICBdKiApIFwiXG4gICAgZml0X3BhZGRpbmcgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdKyApICQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3plcm8gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdICAoPz0gLiogW14gI3t6ZXJvX2xldHRlcnN9IF0gKSApICAgICBcIlxuICAgIGZpdF9vdGhlciAgICAgPSByZWdleFwiKD88bGV0dGVycz4gLiAgICAgICAgICAgICAgICAgICAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGFsbF96ZXJvX3JlICAgPSByZWdleFwiXiAje3plcm9fbGV0dGVyc30rICRcIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5udW5zLmluZGV4T2YgZC5sZXR0ZXJzICkgLSBjZmcubnVucy5sZW5ndGhcbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuenB1bnMuaW5kZXhPZiAgZC5sZXR0ZXJzXG4gICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICBtYW50aXNzYSAgPSBkLm1hbnRpc3NhLnBhZFN0YXJ0IGNmZy5fbWF4X2RpZ2l0c19wZXJfaWR4LCBtYXhfZGlnaXRcbiAgICAgIGQuaW5kZXggICA9ICggZGVjb2RlIG1hbnRpc3NhLCBhbHBoYWJldCApIC0gY2ZnLl9tYXhfaW50ZWdlclxuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGFscGhhYmV0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgPSBSLm5ld19sZXZlbCB7IG5hbWU6ICdmaXJzdCcsIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdudW4nLCAgICAgIGZpdDogZml0X251biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X251biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncHVuJywgICAgICBmaXQ6IGZpdF9wdW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wdW4sICAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ25udW0nLCAgICAgZml0OiBmaXRfbm51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3Rfbm51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwbnVtJywgICAgIGZpdDogZml0X3BudW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BudW0sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncGFkZGluZycsICBmaXQ6IGZpdF9wYWRkaW5nLCAgICAgICAgICAgICAgY2FzdDogY2FzdF9wYWRkaW5nLCAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3plcm8nLCAgICAgZml0OiBmaXRfemVybywgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfemVybywgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdvdGhlcicsICAgIGZpdDogZml0X290aGVyLCBtZXJnZTogJ2xpc3QnLCBjYXN0OiBjYXN0X290aGVyLCAgICB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlOiAoIGludGVnZXJfb3JfbGlzdCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBpZiBBcnJheS5pc0FycmF5IGludGVnZXJfb3JfbGlzdFxuICAgICAgcmV0dXJuICggQGVuY29kZSBuIGZvciBuIGluIGludGVnZXJfb3JfbGlzdCApLmpvaW4gJydcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG4gPSBpbnRlZ2VyX29yX2xpc3RcbiAgICB1bmxlc3MgTnVtYmVyLmlzRmluaXRlIG5cbiAgICAgIHR5cGUgPSAnWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNCBleHBlY3RlZCBhIGZsb2F0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3MgQGNmZy5fbWluX2ludGVnZXIgPD0gbiA8PSBAY2ZnLl9tYXhfaW50ZWdlclxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX181IGV4cGVjdGVkIGEgZmxvYXQgYmV0d2VlbiAje0BjZmcuX21pbl9pbnRlZ2VyfSBhbmQgI3tAY2ZnLl9tYXhfaW50ZWdlcn0sIGdvdCAje259XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBAZW5jb2RlX2ludGVnZXIgblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgIyMjIE5PVEUgY2FsbCBvbmx5IHdoZXJlIGFzc3VyZWQgYG5gIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBaZXJvIG9yIHNtYWxsIHBvc2l0aXZlOlxuICAgIHJldHVybiAoIEBjZmcuenB1bnMuYXQgbiApIGlmIDAgICAgICAgICAgPD0gbiA8PSBAY2ZnLnpwdW5fbWF4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIFNtYWxsIG5lZ2F0aXZlOlxuICAgIHJldHVybiAoIEBjZmcubnVucy5hdCAgbiApIGlmIEBjZmcubnVuX21pbiAgPD0gbiA8ICAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEJpZyBwb3NpdGl2ZTpcbiAgICBpZiBuID4gQGNmZy56cHVuX21heFxuICAgICAgUiA9IGVuY29kZSBuLCBAY2ZnLmFscGhhYmV0XG4gICAgICByZXR1cm4gKCBAY2ZnLnBtYWcuYXQgUi5sZW5ndGggKSArIFJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIG5lZ2F0aXZlOlxuICAgICMjIyBOT1RFIHBsdXMgb25lIG9yIG5vdCBwbHVzIG9uZT8/ICMjI1xuICAgICMgUiA9ICggZW5jb2RlICggbiArIEBjZmcuX21heF9pbnRlZ2VyICsgMSApLCBAY2ZnLmFscGhhYmV0IClcbiAgICBSID0gKCBlbmNvZGUgKCBuICsgQGNmZy5fbWF4X2ludGVnZXIgICAgICksIEBjZmcuYWxwaGFiZXQgKVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy5fbWF4X2RpZ2l0c19wZXJfaWR4XG4gICAgICBSID0gUi5wYWRTdGFydCBAY2ZnLl9tYXhfZGlnaXRzX3Blcl9pZHgsIEBjZmcuYWxwaGFiZXQuYXQgMFxuICAgIGVsc2VcbiAgICAgIFIgPSBSLnJlcGxhY2UgQGNmZy5sZWFkaW5nX25pbmVyc19yZSwgJydcbiAgICByZXR1cm4gKCBAY2ZnLm5tYWcuYXQgUi5sZW5ndGggKSArIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHBhcnNlOiAoIHNvcnRrZXkgKSAtPlxuICAgIFIgPSBbXVxuICAgIGZvciBsZXhlbWUgaW4gQGxleGVyLnNjYW5fdG9fbGlzdCBzb3J0a2V5XG4gICAgICB7IG5hbWUsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBzdG9wLFxuICAgICAgICBkYXRhLCAgICAgICB9ID0gbGV4ZW1lXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHsgbGV0dGVycyxcbiAgICAgICAgbWFudGlzc2EsXG4gICAgICAgIGluZGV4LCAgICAgIH0gPSBkYXRhXG4gICAgICBsZXR0ZXJzICAgICAgICAgPSBsZXR0ZXJzLmpvaW4gJycgaWYgKCB0eXBlX29mIGxldHRlcnMgKSBpcyAnbGlzdCdcbiAgICAgIG1hbnRpc3NhICAgICAgID89IG51bGxcbiAgICAgIGluZGV4ICAgICAgICAgID89IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5wdXNoIHsgbmFtZSwgbGV0dGVycywgbWFudGlzc2EsIGluZGV4LCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZTogKCBzb3J0a2V5ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNvcnRrZXkgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fOSBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBzb3J0a2V5Lmxlbmd0aCA+IDBcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX18xMCBleHBlY3RlZCBhIG5vbi1lbXB0eSB0ZXh0LCBnb3QgI3tycHIgc29ydGtleX1cIlxuICAgIFIgPSBbXVxuICAgIGZvciB1bml0IGluIEBwYXJzZSBzb3J0a2V5XG4gICAgICBpZiB1bml0Lm5hbWUgaXMgJ290aGVyJ1xuICAgICAgICBtZXNzYWdlICAgPSBcIs6paGxsX18xMSBub3QgYSB2YWxpZCBzb3J0a2V5OiB1bmFibGUgdG8gcGFyc2UgI3tycHIgdW5pdC5sZXR0ZXJzfVwiXG4gICAgICAgIG1lc3NhZ2UgICs9IFwiIGluICN7cnByIHNvcnRrZXl9XCIgaWYgc29ydGtleSBpc250IHVuaXQubGV0dGVyc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgbWVzc2FnZVxuICAgICAgUi5wdXNoIHVuaXQuaW5kZXggaWYgdW5pdC5pbmRleD9cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzEyIG5vdCBpbXBsZW1lbnRlZFwiXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBob2xsZXJpdGhfMTAgICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBcbiAgaG9sbGVyaXRoXzEwbXZwICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwXG4gIGhvbGxlcml0aF8xMG12cDIgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cDJcbiAgaG9sbGVyaXRoXzEyOCAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOFxuICBob2xsZXJpdGhfMTI4XzE2MzgzID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XzE2MzgzXG4gIHJldHVybiB7XG4gICAgSG9sbGVyaXRoLFxuICAgIGhvbGxlcml0aF8xMCxcbiAgICBob2xsZXJpdGhfMTBtdnAsXG4gICAgaG9sbGVyaXRoXzEwbXZwMixcbiAgICBob2xsZXJpdGhfMTI4LFxuICAgIGhvbGxlcml0aF8xMjhfMTYzODMsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
