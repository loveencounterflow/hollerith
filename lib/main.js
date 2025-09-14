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
    max_idx_digits: 2,
    _max_integer: (128 ** 2) - 1 // 16383
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
      var R, T, hollerith_cfg_template, max_idx_digits, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.digitset = T.digitset.validate(R.digitset);
      R._digits_list = T.digitset.data._digits_list;
      R._naught = T.digitset.data._naught;
      R._nova = T.digitset.data._nova;
      R._leading_novas_re = T.digitset.data._leading_novas_re;
      R._base = T.digitset.data._base;
      R.magnifiers = T.magnifiers.validate(R.magnifiers);
      R._pmag_list = T.magnifiers.data._pmag_list;
      R._nmag_list = T.magnifiers.data._nmag_list;
      R.uniliterals = T.uniliterals.validate(R.uniliterals);
      R._cipher = T.uniliterals.data._cipher;
      R._nuns = T.uniliterals.data._nuns;
      R._zpuns = T.uniliterals.data._zpuns;
      R._nuns_list = T.uniliterals.data._nuns_list;
      R._zpuns_list = T.uniliterals.data._zpuns_list;
      R._min_nun = -R._nuns_list.length;
      R._max_zpun = R._zpuns_list.length - 1;
      R.dimension = T.dimension.validate(R.dimension);
      //.......................................................................................................
      max_idx_digits = Math.min(R._pmag_list.length - 1, (ref = R.max_idx_digits) != null ? ref : 2e308);
      R.max_idx_digits = T._max_digits_per_idx_$.validate(max_idx_digits, R._pmag_list);
      //.......................................................................................................
      if (R._max_integer != null) {
        R._max_integer = T._max_integer_$.validate(R._max_integer, R._base);
      } else {
        R._max_integer = T.create_max_integer_$({
          _base: R._base,
          digits_numof: R.max_idx_digits
        });
      }
      //.......................................................................................................
      // max_idx_digits       = Math.min ( R._pmag_list.length - 1 ), ( R.max_idx_digits ? Infinity )
      // R.max_idx_digits     = T._max_digits_per_idx_$.validate max_idx_digits, R._pmag_list
      // #.......................................................................................................
      // if R._max_integer?
      //   R._max_integer  = T._max_integer_$.validate R._max_integer, R._base
      //   if R.max_idx_digits?
      // else
      //   R._max_integer  = T.create_max_integer_$ { _base: R._base, digits_numof: R.max_idx_digits, }

      //.......................................................................................................
      if (R._nmag_list.length < R.max_idx_digits) {
        throw new Error(`Ωhll___1 max_idx_digits is ${R.max_idx_digits}, but there are only ${R._nmag_list.length} positive magnifiers`);
      } else if (R._nmag_list.length > R.max_idx_digits) {
        R._nmag_list = freeze(R._nmag_list.slice(0, +R.max_idx_digits + 1 || 9e9));
      }
      //.......................................................................................................
      if (R._pmag_list.length < R.max_idx_digits) {
        throw new Error(`Ωhll___3 max_idx_digits is ${R.max_idx_digits}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R.max_idx_digits) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R.max_idx_digits + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R._nmag_list.join('');
      R._max_idx_width = R.max_idx_digits + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      R._alphabet = T._alphabet.validate((R.digitset + ([...R._nmag_list].reverse().join('')) + R._nuns + R._zpuns + R._pmag).replace(T[CFG].blank_splitter, ''));
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, _nmag, _nuns, _pmag, _zpuns, all_zero_re, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, digitset, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, max_digit, nmag_letters, nuns_letters, pmag_letters, puns_letters, zero_letters;
      ({_nuns, _zpuns, _nmag, _pmag, digitset} = cfg);
      // _base              = digitset.length
      //.......................................................................................................
      nuns_letters = _nuns;
      puns_letters = _zpuns.slice(1);
      nmag_letters = _nmag.slice(1);
      pmag_letters = _pmag.slice(1);
      zero_letters = _zpuns[0];
      max_digit = digitset.at(-1);
      //.......................................................................................................
      fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${digitset}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.......................................................................................................
      cast_nun = function({
          data: d
        }) {
        return d.index = (cfg._nuns.indexOf(d.letters)) - cfg._nuns.length;
      };
      cast_pun = function({
          data: d
        }) {
        return d.index = +cfg._zpuns.indexOf(d.letters);
      };
      cast_nnum = function({
          data: d
        }) {
        var mantissa;
        mantissa = d.mantissa.padStart(cfg.max_idx_digits, max_digit);
        return d.index = (decode(mantissa, digitset)) - cfg._max_integer;
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
      if ((0 <= n && n <= this.cfg._max_zpun)) { // Zero or small positive
        /* NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` */
        //.......................................................................................................
        return this.cfg._zpuns.at(n);
      }
      if ((this.cfg._min_nun <= n && n < 0)) { // Small negative
        return this.cfg._nuns.at(n);
      }
      //.......................................................................................................
      if (n > this.cfg._max_zpun) { // Big positive
        R = encode(n, this.cfg.digitset);
        return (this.cfg._pmag.at(R.length)) + R;
      }
      //.......................................................................................................
      R = encode(n + this.cfg._max_integer, this.cfg.digitset); // Big negative
      if (R.length < this.cfg.max_idx_digits) {
        R = R.padStart(this.cfg.max_idx_digits, this.cfg.digitset.at(0));
      } else {
        R = R.replace(this.cfg._leading_novas_re, '');
      }
      return (this.cfg._nmag.at(R.length)) + R;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsbUJBQUEsRUFBQSxTQUFBLEVBQUEsV0FBQSxFQUFBLEtBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Ozs7O0VBS0EsU0FBQSxHQUE0QixPQUFBLENBQVEsK0JBQVI7O0VBQzVCLENBQUEsQ0FBRSxPQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxlQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUE7SUFBRSxjQUFBLEVBQWdCO0VBQWxCLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxZQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUFBLENBQVEsT0FBUixDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixFQUNFLEtBREYsRUFFRSxNQUZGLENBQUEsR0FFNEIsT0FBQSxDQUFRLFVBQVIsQ0FGNUI7O0VBR0EsS0FBQSxHQUE0QixPQUFBLENBQVEsU0FBUjs7RUFDNUIsQ0FBQSxDQUFFLEdBQUYsRUFDRSxtQkFERixDQUFBLEdBQzRCLEtBRDVCOztFQUVBLENBQUEsQ0FBRSxZQUFGLENBQUEsR0FBNEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxvQkFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENB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PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgR3JhbW1hclxuICBUb2tlblxuICBMZXhlbWUgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xudHlwZXMgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vdHlwZXMnXG57IENGRyxcbiAgSG9sbGVyaXRoX3R5cGVzcGFjZSwgIH0gPSB0eXBlc1xueyBjbGVhbl9hc3NpZ24sICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG57IGVuY29kZSxcbiAgZGVjb2RlLFxuICBsb2dfdG9fYmFzZSxcbiAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiAgZ2V0X21heF9pbnRlZ2VyLCAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9hbnliYXNlKClcbnsgZnJlZXplLCAgICAgICAgICAgICAgIH0gPSBPYmplY3RcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjggPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIyMgICAgICAgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4XzE2MzgzID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG4gIG1heF9pZHhfZGlnaXRzOiAgICAgMlxuICBfbWF4X2ludGVnZXI6ICAgICAgICggMTI4ICoqIDIgKSAtIDEgIyAxNjM4M1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5Egw6Mgw6TDpcOmJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICdOJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdKS0xNIE9QUVInXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cDIgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICBkaWdpdHNldDogICAgICAgICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICAgICAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgICAgICAgIDNcbiAgX21heF9pbnRlZ2VyOiAgICAgICA5OTlcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTI4XG5jb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEwXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaW50ZXJuYWxzID0gZnJlZXplIHsgY29uc3RhbnRzLCB0eXBlcywgfVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgSG9sbGVyaXRoXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogKCBjZmcgKSAtPlxuICAgIGNsYXN6ICAgICAgICAgICA9IEBjb25zdHJ1Y3RvclxuICAgIEBjZmcgICAgICAgICAgICA9IGZyZWV6ZSBjbGFzei52YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmcgY2ZnXG4gICAgQGxleGVyICAgICAgICAgID0gQGNvbXBpbGVfc29ydGtleV9sZXhlciBAY2ZnXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHZhbGlkYXRlX2FuZF9jb21waWxlX2NmZzogKCBjZmcgKSAtPlxuICAgICMjIyBWYWxpZGF0aW9uczogIyMjXG4gICAgIyMjIERlcml2YXRpb25zOiAjIyNcbiAgICBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlID1cbiAgICAgIGJsYW5rOiAgICAgICAgJ1xceDIwJ1xuICAgICAgZGltZW5zaW9uOiAgIDVcbiAgICBSICAgICAgICAgICAgICAgICAgICAgPSBjbGVhbl9hc3NpZ24ge30sIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUsIGNmZ1xuICAgIFQgICAgICAgICAgICAgICAgICAgICA9IG5ldyBIb2xsZXJpdGhfdHlwZXNwYWNlIHsgYmxhbms6IFIuYmxhbmssIH1cbiAgICBSLmRpZ2l0c2V0ICAgICAgICAgICAgPSBULmRpZ2l0c2V0LnZhbGlkYXRlIFIuZGlnaXRzZXRcbiAgICBSLl9kaWdpdHNfbGlzdCAgICAgICAgPSBULmRpZ2l0c2V0LmRhdGEuX2RpZ2l0c19saXN0XG4gICAgUi5fbmF1Z2h0ICAgICAgICAgICAgID0gVC5kaWdpdHNldC5kYXRhLl9uYXVnaHRcbiAgICBSLl9ub3ZhICAgICAgICAgICAgICAgPSBULmRpZ2l0c2V0LmRhdGEuX25vdmFcbiAgICBSLl9sZWFkaW5nX25vdmFzX3JlICAgPSBULmRpZ2l0c2V0LmRhdGEuX2xlYWRpbmdfbm92YXNfcmVcbiAgICBSLl9iYXNlICAgICAgICAgICAgICAgPSBULmRpZ2l0c2V0LmRhdGEuX2Jhc2VcbiAgICBSLm1hZ25pZmllcnMgICAgICAgICAgPSBULm1hZ25pZmllcnMudmFsaWRhdGUgUi5tYWduaWZpZXJzXG4gICAgUi5fcG1hZ19saXN0ICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEuX3BtYWdfbGlzdFxuICAgIFIuX25tYWdfbGlzdCAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLl9ubWFnX2xpc3RcbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSBULnVuaWxpdGVyYWxzLnZhbGlkYXRlIFIudW5pbGl0ZXJhbHNcbiAgICBSLl9jaXBoZXIgICAgICAgICAgICAgPSBULnVuaWxpdGVyYWxzLmRhdGEuX2NpcGhlclxuICAgIFIuX251bnMgICAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fbnVuc1xuICAgIFIuX3pwdW5zICAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNcbiAgICBSLl9udW5zX2xpc3QgICAgICAgICAgPSBULnVuaWxpdGVyYWxzLmRhdGEuX251bnNfbGlzdFxuICAgIFIuX3pwdW5zX2xpc3QgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5fenB1bnNfbGlzdFxuICAgIFIuX21pbl9udW4gICAgICAgICAgICA9IC1SLl9udW5zX2xpc3QubGVuZ3RoXG4gICAgUi5fbWF4X3pwdW4gICAgICAgICAgID0gUi5fenB1bnNfbGlzdC5sZW5ndGggLSAxXG4gICAgUi5kaW1lbnNpb24gICAgICAgICAgID0gVC5kaW1lbnNpb24udmFsaWRhdGUgUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG1heF9pZHhfZGlnaXRzICAgICAgID0gTWF0aC5taW4gKCBSLl9wbWFnX2xpc3QubGVuZ3RoIC0gMSApLCAoIFIubWF4X2lkeF9kaWdpdHMgPyBJbmZpbml0eSApXG4gICAgUi5tYXhfaWR4X2RpZ2l0cyAgICAgPSBULl9tYXhfZGlnaXRzX3Blcl9pZHhfJC52YWxpZGF0ZSBtYXhfaWR4X2RpZ2l0cywgUi5fcG1hZ19saXN0XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBSLl9tYXhfaW50ZWdlcj8gIHRoZW4gIFIuX21heF9pbnRlZ2VyICA9IFQuX21heF9pbnRlZ2VyXyQudmFsaWRhdGUgUi5fbWF4X2ludGVnZXIsIFIuX2Jhc2VcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgIFIuX21heF9pbnRlZ2VyICA9IFQuY3JlYXRlX21heF9pbnRlZ2VyXyQgeyBfYmFzZTogUi5fYmFzZSwgZGlnaXRzX251bW9mOiBSLm1heF9pZHhfZGlnaXRzLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIG1heF9pZHhfZGlnaXRzICAgICAgID0gTWF0aC5taW4gKCBSLl9wbWFnX2xpc3QubGVuZ3RoIC0gMSApLCAoIFIubWF4X2lkeF9kaWdpdHMgPyBJbmZpbml0eSApXG4gICAgIyBSLm1heF9pZHhfZGlnaXRzICAgICA9IFQuX21heF9kaWdpdHNfcGVyX2lkeF8kLnZhbGlkYXRlIG1heF9pZHhfZGlnaXRzLCBSLl9wbWFnX2xpc3RcbiAgICAjICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBpZiBSLl9tYXhfaW50ZWdlcj9cbiAgICAjICAgUi5fbWF4X2ludGVnZXIgID0gVC5fbWF4X2ludGVnZXJfJC52YWxpZGF0ZSBSLl9tYXhfaW50ZWdlciwgUi5fYmFzZVxuICAgICMgICBpZiBSLm1heF9pZHhfZGlnaXRzP1xuICAgICMgZWxzZVxuICAgICMgICBSLl9tYXhfaW50ZWdlciAgPSBULmNyZWF0ZV9tYXhfaW50ZWdlcl8kIHsgX2Jhc2U6IFIuX2Jhc2UsIGRpZ2l0c19udW1vZjogUi5tYXhfaWR4X2RpZ2l0cywgfVxuXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiBSLl9ubWFnX2xpc3QubGVuZ3RoIDwgUi5tYXhfaWR4X2RpZ2l0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18xIG1heF9pZHhfZGlnaXRzIGlzICN7Ui5tYXhfaWR4X2RpZ2l0c30sIGJ1dCB0aGVyZSBhcmUgb25seSAje1IuX25tYWdfbGlzdC5sZW5ndGh9IHBvc2l0aXZlIG1hZ25pZmllcnNcIlxuICAgIGVsc2UgaWYgUi5fbm1hZ19saXN0Lmxlbmd0aCA+IFIubWF4X2lkeF9kaWdpdHNcbiAgICAgIFIuX25tYWdfbGlzdCA9IGZyZWV6ZSBSLl9ubWFnX2xpc3RbIC4uIFIubWF4X2lkeF9kaWdpdHMgXVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5fcG1hZ19saXN0Lmxlbmd0aCA8IFIubWF4X2lkeF9kaWdpdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMyBtYXhfaWR4X2RpZ2l0cyBpcyAje1IubWF4X2lkeF9kaWdpdHN9LCBidXQgdGhlcmUgYXJlIG9ubHkgI3tSLl9wbWFnX2xpc3QubGVuZ3RofSBwb3NpdGl2ZSBtYWduaWZpZXJzXCJcbiAgICBlbHNlIGlmIFIuX3BtYWdfbGlzdC5sZW5ndGggPiBSLm1heF9pZHhfZGlnaXRzXG4gICAgICBSLl9wbWFnX2xpc3QgPSBmcmVlemUgUi5fcG1hZ19saXN0WyAuLiBSLm1heF9pZHhfZGlnaXRzIF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX3BtYWcgICAgICAgICAgICAgICA9IFIuX3BtYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbm1hZyAgICAgICAgICAgICAgID0gUi5fbm1hZ19saXN0LmpvaW4gJydcbiAgICBSLl9tYXhfaWR4X3dpZHRoICAgICAgPSBSLm1heF9pZHhfZGlnaXRzICsgMVxuICAgIFIuX3NvcnRrZXlfd2lkdGggICAgICA9IFIuX21heF9pZHhfd2lkdGggKiBSLmRpbWVuc2lvblxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUi5fbWluX2ludGVnZXIgICAgICAgID0gLVIuX21heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgVEFJTlQgdGhpcyBjYW4gYmUgZ3JlYXRseSBzaW1wbGlmaWVkIHdpdGggVG8gRG9zIGltcGxlbWVudGVkICMjI1xuICAgIFIuX2FscGhhYmV0ICAgICAgICAgICA9IFQuX2FscGhhYmV0LnZhbGlkYXRlICggUi5kaWdpdHNldCArICggXFxcbiAgICAgIFsgUi5fbm1hZ19saXN0Li4uLCBdLnJldmVyc2UoKS5qb2luICcnICkgKyBcXFxuICAgICAgUi5fbnVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLl96cHVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIuX3BtYWcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLnJlcGxhY2UgVFtDRkddLmJsYW5rX3NwbGl0dGVyLCAnJ1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb21waWxlX3NvcnRrZXlfbGV4ZXI6ICggY2ZnICkgLT5cbiAgICB7IF9udW5zLFxuICAgICAgX3pwdW5zLFxuICAgICAgX25tYWcsXG4gICAgICBfcG1hZyxcbiAgICAgIGRpZ2l0c2V0LCAgICAgfSA9IGNmZ1xuICAgICMgX2Jhc2UgICAgICAgICAgICAgID0gZGlnaXRzZXQubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBudW5zX2xldHRlcnMgID0gX251bnNcbiAgICBwdW5zX2xldHRlcnMgID0gX3pwdW5zWyAgMSAuLiAgXVxuICAgIG5tYWdfbGV0dGVycyAgPSBfbm1hZ1sgICAxIC4uICBdXG4gICAgcG1hZ19sZXR0ZXJzICA9IF9wbWFnWyAgIDEgLi4gIF1cbiAgICB6ZXJvX2xldHRlcnMgID0gX3pwdW5zWyAgMCAgICAgXVxuICAgIG1heF9kaWdpdCAgICAgPSBkaWdpdHNldC5hdCAtMVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZml0X251biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bnVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3B1biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cHVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X25udW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bm1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7ZGlnaXRzZXR9ICBdKiApIFwiXG4gICAgZml0X3BudW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cG1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7ZGlnaXRzZXR9ICBdKiApIFwiXG4gICAgZml0X3BhZGRpbmcgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdKyApICQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3plcm8gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdICAoPz0gLiogW14gI3t6ZXJvX2xldHRlcnN9IF0gKSApICAgICBcIlxuICAgIGZpdF9vdGhlciAgICAgPSByZWdleFwiKD88bGV0dGVycz4gLiAgICAgICAgICAgICAgICAgICAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGFsbF96ZXJvX3JlICAgPSByZWdleFwiXiAje3plcm9fbGV0dGVyc30rICRcIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5fbnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLl9udW5zLmxlbmd0aFxuICAgIGNhc3RfcHVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gK2NmZy5fenB1bnMuaW5kZXhPZiAgZC5sZXR0ZXJzXG4gICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICBtYW50aXNzYSAgPSBkLm1hbnRpc3NhLnBhZFN0YXJ0IGNmZy5tYXhfaWR4X2RpZ2l0cywgbWF4X2RpZ2l0XG4gICAgICBkLmluZGV4ICAgPSAoIGRlY29kZSBtYW50aXNzYSwgZGlnaXRzZXQgKSAtIGNmZy5fbWF4X2ludGVnZXJcbiAgICBjYXN0X3BudW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IGRlY29kZSBkLm1hbnRpc3NhLCBkaWdpdHNldFxuICAgIGNhc3RfemVybyAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gMFxuICAgIGNhc3RfcGFkZGluZyAgPSAoeyBkYXRhOiBkLCBzb3VyY2UsIGhpdCwgfSkgLT4gZC5pbmRleCA9IDAgaWYgc291cmNlIGlzIGhpdFxuICAgIGNhc3Rfb3RoZXIgICAgPSBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSICAgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaW50ZWdlcl9vcl9saXN0ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIGlmIEFycmF5LmlzQXJyYXkgaW50ZWdlcl9vcl9saXN0XG4gICAgICByZXR1cm4gKCBAZW5jb2RlIG4gZm9yIG4gaW4gaW50ZWdlcl9vcl9saXN0ICkuam9pbiAnJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbiA9IGludGVnZXJfb3JfbGlzdFxuICAgIHVubGVzcyBOdW1iZXIuaXNGaW5pdGUgblxuICAgICAgdHlwZSA9ICdYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX180IGV4cGVjdGVkIGEgZmxvYXQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBAY2ZnLl9taW5faW50ZWdlciA8PSBuIDw9IEBjZmcuX21heF9pbnRlZ2VyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzUgZXhwZWN0ZWQgYSBmbG9hdCBiZXR3ZWVuICN7QGNmZy5fbWluX2ludGVnZXJ9IGFuZCAje0BjZmcuX21heF9pbnRlZ2VyfSwgZ290ICN7bn1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIEBlbmNvZGVfaW50ZWdlciBuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICAjIyMgTk9URSBjYWxsIG9ubHkgd2hlcmUgYXNzdXJlZCBgbmAgaXMgaW50ZWdlciB3aXRoaW4gbWFnbml0dWRlIG9mIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAgIyMjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gKCBAY2ZnLl96cHVucy5hdCBuICkgaWYgMCAgICAgICAgICAgICAgPD0gbiA8PSBAY2ZnLl9tYXhfenB1biAgIyBaZXJvIG9yIHNtYWxsIHBvc2l0aXZlXG4gICAgcmV0dXJuICggQGNmZy5fbnVucy5hdCAgbiApIGlmIEBjZmcuX21pbl9udW4gIDw9IG4gPCAgMCAgICAgICAgICAgICAgICMgU21hbGwgbmVnYXRpdmVcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIG4gPiBAY2ZnLl9tYXhfenB1biAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIEJpZyBwb3NpdGl2ZVxuICAgICAgUiA9IGVuY29kZSBuLCBAY2ZnLmRpZ2l0c2V0XG4gICAgICByZXR1cm4gKCBAY2ZnLl9wbWFnLmF0IFIubGVuZ3RoICkgKyBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gKCBlbmNvZGUgKCBuICsgQGNmZy5fbWF4X2ludGVnZXIgICAgICksIEBjZmcuZGlnaXRzZXQgKSAgICAgICAgICAgIyBCaWcgbmVnYXRpdmVcbiAgICBpZiBSLmxlbmd0aCA8IEBjZmcubWF4X2lkeF9kaWdpdHMgdGhlbiBSID0gUi5wYWRTdGFydCBAY2ZnLm1heF9pZHhfZGlnaXRzLCBAY2ZnLmRpZ2l0c2V0LmF0IDBcbiAgICBlbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUiA9IFIucmVwbGFjZSBAY2ZnLl9sZWFkaW5nX25vdmFzX3JlLCAnJ1xuICAgIHJldHVybiAoIEBjZmcuX25tYWcuYXQgUi5sZW5ndGggKSArIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHBhcnNlOiAoIHNvcnRrZXkgKSAtPlxuICAgIFIgPSBbXVxuICAgIGZvciBsZXhlbWUgaW4gQGxleGVyLnNjYW5fdG9fbGlzdCBzb3J0a2V5XG4gICAgICB7IG5hbWUsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBzdG9wLFxuICAgICAgICBkYXRhLCAgICAgICB9ID0gbGV4ZW1lXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHsgbGV0dGVycyxcbiAgICAgICAgbWFudGlzc2EsXG4gICAgICAgIGluZGV4LCAgICAgIH0gPSBkYXRhXG4gICAgICBsZXR0ZXJzICAgICAgICAgPSBsZXR0ZXJzLmpvaW4gJycgaWYgKCB0eXBlX29mIGxldHRlcnMgKSBpcyAnbGlzdCdcbiAgICAgIG1hbnRpc3NhICAgICAgID89IG51bGxcbiAgICAgIGluZGV4ICAgICAgICAgID89IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5wdXNoIHsgbmFtZSwgbGV0dGVycywgbWFudGlzc2EsIGluZGV4LCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZTogKCBzb3J0a2V5ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNvcnRrZXkgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fOSBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBzb3J0a2V5Lmxlbmd0aCA+IDBcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX18xMCBleHBlY3RlZCBhIG5vbi1lbXB0eSB0ZXh0LCBnb3QgI3tycHIgc29ydGtleX1cIlxuICAgIFIgPSBbXVxuICAgIGZvciB1bml0IGluIEBwYXJzZSBzb3J0a2V5XG4gICAgICBpZiB1bml0Lm5hbWUgaXMgJ290aGVyJ1xuICAgICAgICBtZXNzYWdlICAgPSBcIs6paGxsX18xMSBub3QgYSB2YWxpZCBzb3J0a2V5OiB1bmFibGUgdG8gcGFyc2UgI3tycHIgdW5pdC5sZXR0ZXJzfVwiXG4gICAgICAgIG1lc3NhZ2UgICs9IFwiIGluICN7cnByIHNvcnRrZXl9XCIgaWYgc29ydGtleSBpc250IHVuaXQubGV0dGVyc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgbWVzc2FnZVxuICAgICAgUi5wdXNoIHVuaXQuaW5kZXggaWYgdW5pdC5pbmRleD9cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzEyIG5vdCBpbXBsZW1lbnRlZFwiXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBob2xsZXJpdGhfMTAgICAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBcbiAgaG9sbGVyaXRoXzEwbXZwICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwXG4gIGhvbGxlcml0aF8xMG12cDIgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cDJcbiAgaG9sbGVyaXRoXzEyOCAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOFxuICBob2xsZXJpdGhfMTI4XzE2MzgzID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XzE2MzgzXG4gIHJldHVybiB7XG4gICAgSG9sbGVyaXRoLFxuICAgIGhvbGxlcml0aF8xMCxcbiAgICBob2xsZXJpdGhfMTBtdnAsXG4gICAgaG9sbGVyaXRoXzEwbXZwMixcbiAgICBob2xsZXJpdGhfMTI4LFxuICAgIGhvbGxlcml0aF8xMjhfMTYzODMsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
