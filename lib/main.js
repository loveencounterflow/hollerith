(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128b, debug, decode, encode, get_max_integer, get_max_niners, get_required_digits, internals, log_to_base, regex, rpr, type_of, types;

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

  ({encode, decode, log_to_base, get_required_digits, get_max_niners, get_max_integer} = SFMODULES.unstable.require_anybase());

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = Object.freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    zpun_max: +20,
    nun_min: -20,
    zero_pad_length: 8,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_128b = Object.freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    zpun_max: +0,
    nun_min: -0,
    zero_pad_length: 8,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10 = Object.freeze({
    uniliterals: 'ÏÐÑ ã äåæ',
    zpun_max: +3,
    nun_min: -3,
    zero_pad_length: 3,
    alphabet: '0123456789',
    magnifiers: 'ÇÈÉÊËÌÍÎ øùúûüýþÿ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = Object.freeze({
    uniliterals: 'N',
    zpun_max: +0,
    nun_min: -0,
    zero_pad_length: 3,
    alphabet: '0123456789',
    magnifiers: 'JKLM OPQR',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = Object.freeze({
    uniliterals: 'EFGHIJKLM N OPQRSTUVW',
    zpun_max: +9,
    nun_min: -9,
    zero_pad_length: 3,
    alphabet: '0123456789',
    magnifiers: 'ABC XYZ',
    dimension: 5
  });

  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = Object.freeze({constants, types});

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      var clasz;
      clasz = this.constructor;
      this.cfg = Object.freeze(clasz.validate_and_compile_cfg(cfg));
      this.lexer = this.compile_sortkey_lexer(this.cfg);
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static validate_and_compile_cfg(cfg) {
      /* Validations: */
      /* Derivations: */
      var R, T, hollerith_cfg_template;
      hollerith_cfg_template = {
        blank: '\x20'
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.alphabet = T.alphabet.validate(cfg.alphabet);
      R.alphabet_chrs = T.alphabet.data.alphabet_chrs;
      R.niner = T.alphabet.data.niner;
      R.leading_niners_re = T.alphabet.data.leading_niners_re;
      R.base = T.alphabet.data.base;
      R.magnifiers = T.magnifiers.validate(cfg.magnifiers);
      R.pmag = T.magnifiers.data.pmag;
      R.nmag = T.magnifiers.data.nmag;
      R.pmag_chrs = T.magnifiers.data.pmag_chrs;
      R.nmag_chrs = T.magnifiers.data.nmag_chrs;
      R.uniliterals = T.uniliterals.validate(cfg.uniliterals);
      R.nuns = T.uniliterals.data.nuns;
      R.zpuns = T.uniliterals.data.zpuns;
      R.nun_chrs = T.uniliterals.data.nun_chrs;
      R.zpun_chrs = T.uniliterals.data.zpun_chrs;
      R.nun_min = -R.nun_chrs.length;
      R.zpun_max = R.zpun_chrs.length - 1;
      R.dimension = T.dimension.validate(cfg.dimension);
      R.max_digits = R.pmag_chrs.length - 1;
      R.max_integer = (R.base ** R.max_digits) - 1;
      R.min_integer = -R.max_integer;
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
        mantissa = d.mantissa.padStart(cfg.zero_pad_length, max_digit);
        return d.index = (decode(mantissa, alphabet)) - cfg.max_integer;
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
        throw new Error(`Ωhll___2 expected a float, got a ${type}`);
      }
      if (!((this.cfg.min_integer <= n && n <= this.cfg.max_integer))) {
        throw new Error(`Ωhll___3 expected a float between ${this.cfg.min_integer} and ${this.cfg.max_integer}, got ${n}`);
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
      // R = ( encode ( n + @cfg.max_integer + 1 ), @cfg.alphabet )
      R = encode(n + this.cfg.max_integer, this.cfg.alphabet);
      // debug 'Ωhll___4', { n, R, }
      if (R.length < this.cfg.zero_pad_length) {
        R = R.padStart(this.cfg.zero_pad_length, this.cfg.alphabet.at(0));
      } else {
        // debug 'Ωhll___5', { n, R, }
        R = R.replace(this.cfg.leading_niners_re, '');
      }
      // debug 'Ωhll___6', { n, R, }
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
        throw new Error(`Ωhll___7 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll___8 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll___9 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
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
    decode_integer(n) {}

  };

  //===========================================================================================================
  module.exports = (() => {
    var hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128b;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128b = new Hollerith(constants_128b);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128b, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxjQUFBLEVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsZUFBQSxFQUFBLGNBQUEsRUFBQSxtQkFBQSxFQUFBLFNBQUEsRUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7Ozs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxLQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixDQUFBLENBQUUsR0FBRixFQUNFLG1CQURGLENBQUEsR0FDNEIsS0FENUI7O0VBRUEsQ0FBQSxDQUFFLFlBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FB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LENBQUEsQ0FBaUQsR0FBQSxDQUFJLElBQUksQ0FBQyxPQUFULENBQWpELENBQUE7VUFDWixJQUFvQyxPQUFBLEtBQWEsSUFBSSxDQUFDLE9BQXREO1lBQUEsT0FBQSxJQUFZLENBQUEsSUFBQSxDQUFBLENBQU8sR0FBQSxDQUFJLE9BQUosQ0FBUCxDQUFBLEVBQVo7O1VBQ0EsTUFBTSxJQUFJLEtBQUosQ0FBVSxPQUFWLEVBSFI7O1FBSUEsSUFBcUIsa0JBQXJCO1VBQUEsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFJLENBQUMsS0FBWixFQUFBOztNQUxGO0FBTUEsYUFBTztJQWJELENBM0pWOzs7SUEyS0UsY0FBZ0IsQ0FBRSxDQUFGLENBQUEsRUFBQTs7RUE3S2xCLEVBbEdBOzs7RUFrUkEsTUFBTSxDQUFDLE9BQVAsR0FBb0IsQ0FBQSxDQUFBLENBQUEsR0FBQTtBQUNwQixRQUFBLFlBQUEsRUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUE7SUFBRSxZQUFBLEdBQW9CLElBQUksU0FBSixDQUFjLFlBQWQ7SUFDcEIsZUFBQSxHQUFvQixJQUFJLFNBQUosQ0FBYyxlQUFkO0lBQ3BCLGdCQUFBLEdBQW9CLElBQUksU0FBSixDQUFjLGdCQUFkO0lBQ3BCLGFBQUEsR0FBb0IsSUFBSSxTQUFKLENBQWMsYUFBZDtJQUNwQixjQUFBLEdBQW9CLElBQUksU0FBSixDQUFjLGNBQWQ7QUFDcEIsV0FBTyxDQUNMLFNBREssRUFFTCxZQUZLLEVBR0wsZUFISyxFQUlMLGdCQUpLLEVBS0wsYUFMSyxFQU1MLGNBTkssRUFPTCxTQVBLO0VBTlcsQ0FBQTtBQWxScEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcbnsgR3JhbW1hclxuICBUb2tlblxuICBMZXhlbWUgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ2ludGVybGV4J1xudHlwZXMgICAgICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJy4vdHlwZXMnXG57IENGRyxcbiAgSG9sbGVyaXRoX3R5cGVzcGFjZSwgIH0gPSB0eXBlc1xueyBjbGVhbl9hc3NpZ24sICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2NsZWFuX2Fzc2lnbigpXG57IGVuY29kZSxcbiAgZGVjb2RlLFxuICBsb2dfdG9fYmFzZSxcbiAgZ2V0X3JlcXVpcmVkX2RpZ2l0cyxcbiAgZ2V0X21heF9uaW5lcnMsXG4gIGdldF9tYXhfaW50ZWdlciwgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4ID0gT2JqZWN0LmZyZWV6ZVxuICB1bmlsaXRlcmFsczogICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gIHpwdW5fbWF4OiAgICAgKzIwXG4gIG51bl9taW46ICAgICAgLTIwXG4gIHplcm9fcGFkX2xlbmd0aDogOFxuICAjIyMgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgYWxwaGFiZXQ6ICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgbWFnbmlmaWVyczogICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4YiA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICB6cHVuX21heDogICAgICswXG4gIG51bl9taW46ICAgICAgLTBcbiAgemVyb19wYWRfbGVuZ3RoOiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORIMOjIMOkw6XDpidcbiAgenB1bl9tYXg6ICAgICArM1xuICBudW5fbWluOiAgICAgIC0zXG4gIHplcm9fcGFkX2xlbmd0aDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBPYmplY3QuZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgJ04nXG4gIHpwdW5fbWF4OiAgICAgKzBcbiAgbnVuX21pbjogICAgICAtMFxuICB6ZXJvX3BhZF9sZW5ndGg6ICAzXG4gIGFscGhhYmV0OiAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgJ0pLTE0gT1BRUidcbiAgZGltZW5zaW9uOiAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICB6cHVuX21heDogICAgICs5XG4gIG51bl9taW46ICAgICAgLTlcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTI4XG5jb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEwXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGNvbnN0YW50cywgdHlwZXMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBAY2ZnICAgICAgICAgICAgPSBPYmplY3QuZnJlZXplIGNsYXN6LnZhbGlkYXRlX2FuZF9jb21waWxlX2NmZyBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAdmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnOiAoIGNmZyApIC0+XG4gICAgIyMjIFZhbGlkYXRpb25zOiAjIyNcbiAgICAjIyMgRGVyaXZhdGlvbnM6ICMjI1xuICAgIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUgPVxuICAgICAgYmxhbms6ICAnXFx4MjAnXG4gICAgUiAgICAgICAgICAgICAgICAgICAgID0gY2xlYW5fYXNzaWduIHt9LCBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlLCBjZmdcbiAgICBUICAgICAgICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSB7IGJsYW5rOiBSLmJsYW5rLCB9XG4gICAgUi5hbHBoYWJldCAgICAgICAgICAgID0gVC5hbHBoYWJldC52YWxpZGF0ZSBjZmcuYWxwaGFiZXRcbiAgICBSLmFscGhhYmV0X2NocnMgICAgICAgPSBULmFscGhhYmV0LmRhdGEuYWxwaGFiZXRfY2hyc1xuICAgIFIubmluZXIgICAgICAgICAgICAgICA9IFQuYWxwaGFiZXQuZGF0YS5uaW5lclxuICAgIFIubGVhZGluZ19uaW5lcnNfcmUgICA9IFQuYWxwaGFiZXQuZGF0YS5sZWFkaW5nX25pbmVyc19yZVxuICAgIFIuYmFzZSAgICAgICAgICAgICAgICA9IFQuYWxwaGFiZXQuZGF0YS5iYXNlXG4gICAgUi5tYWduaWZpZXJzICAgICAgICAgID0gVC5tYWduaWZpZXJzLnZhbGlkYXRlIGNmZy5tYWduaWZpZXJzXG4gICAgUi5wbWFnICAgICAgICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEucG1hZ1xuICAgIFIubm1hZyAgICAgICAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLm5tYWdcbiAgICBSLnBtYWdfY2hycyAgICAgICAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5wbWFnX2NocnNcbiAgICBSLm5tYWdfY2hycyAgICAgICAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5ubWFnX2NocnNcbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSBULnVuaWxpdGVyYWxzLnZhbGlkYXRlIGNmZy51bmlsaXRlcmFsc1xuICAgIFIubnVucyAgICAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5udW5zXG4gICAgUi56cHVucyAgICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLnpwdW5zXG4gICAgUi5udW5fY2hycyAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLm51bl9jaHJzXG4gICAgUi56cHVuX2NocnMgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLnpwdW5fY2hyc1xuICAgIFIubnVuX21pbiAgICAgICAgICAgICA9IC1SLm51bl9jaHJzLmxlbmd0aFxuICAgIFIuenB1bl9tYXggICAgICAgICAgICA9IFIuenB1bl9jaHJzLmxlbmd0aCAtIDFcbiAgICBSLmRpbWVuc2lvbiAgICAgICAgICAgPSBULmRpbWVuc2lvbi52YWxpZGF0ZSBjZmcuZGltZW5zaW9uXG4gICAgUi5tYXhfZGlnaXRzICAgICAgICAgID0gUi5wbWFnX2NocnMubGVuZ3RoIC0gMVxuICAgIFIubWF4X2ludGVnZXIgICAgICAgICA9ICggUi5iYXNlICoqIFIubWF4X2RpZ2l0cyApIC0gMVxuICAgIFIubWluX2ludGVnZXIgICAgICAgICA9IC1SLm1heF9pbnRlZ2VyXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIyMgVEFJTlQgdGhpcyBjYW4gYmUgZ3JlYXRseSBzaW1wbGlmaWVkIHdpdGggVG8gRG9zIGltcGxlbWVudGVkICMjI1xuICAgIFIuVE1QX2FscGhhYmV0ICA9IFQuVE1QX2FscGhhYmV0LnZhbGlkYXRlICggUi5hbHBoYWJldCArICggXFxcbiAgICAgIFsgUi5ubWFnX2NocnMuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJycgKSArIFxcXG4gICAgICBSLm51bnMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi56cHVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIucG1hZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkucmVwbGFjZSBUW0NGR10uYmxhbmtfc3BsaXR0ZXIsICcnXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbXBpbGVfc29ydGtleV9sZXhlcjogKCBjZmcgKSAtPlxuICAgIHsgbnVucyxcbiAgICAgIHpwdW5zLFxuICAgICAgbm1hZyxcbiAgICAgIHBtYWcsXG4gICAgICBhbHBoYWJldCwgICAgIH0gPSBjZmdcbiAgICAjIGJhc2UgICAgICAgICAgICAgID0gYWxwaGFiZXQubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBudW5zX2xldHRlcnMgID0gbnVuc1xuICAgIHB1bnNfbGV0dGVycyAgPSB6cHVuc1sgIDEgLi4gIF1cbiAgICBubWFnX2xldHRlcnMgID0gbm1hZ1sgICAxIC4uICBdXG4gICAgcG1hZ19sZXR0ZXJzICA9IHBtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSB6cHVuc1sgIDAgICAgIF1cbiAgICBtYXhfZGlnaXQgICAgID0gYWxwaGFiZXQuYXQgLTFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGZpdF9udW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje251bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9wdW4gICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3B1bnNfbGV0dGVyc30gXSAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF9ubnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje25tYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2FscGhhYmV0fSAgXSogKSBcIlxuICAgIGZpdF9wbnVtICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3BtYWdfbGV0dGVyc30gXSAgKSAoPzxtYW50aXNzYT4gWyAje2FscGhhYmV0fSAgXSogKSBcIlxuICAgIGZpdF9wYWRkaW5nICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSsgKSAkICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGZpdF96ZXJvICAgICAgPSByZWdleFwiKD88bGV0dGVycz4gWyAje3plcm9fbGV0dGVyc30gXSAgKD89IC4qIFteICN7emVyb19sZXR0ZXJzfSBdICkgKSAgICAgXCJcbiAgICBmaXRfb3RoZXIgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IC4gICAgICAgICAgICAgICAgICAgICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBhbGxfemVyb19yZSAgID0gcmVnZXhcIl4gI3t6ZXJvX2xldHRlcnN9KyAkXCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNhc3RfbnVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gKCBjZmcubnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLm51bnMubGVuZ3RoXG4gICAgY2FzdF9wdW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSArY2ZnLnpwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3Rfbm51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPlxuICAgICAgbWFudGlzc2EgID0gZC5tYW50aXNzYS5wYWRTdGFydCBjZmcuemVyb19wYWRfbGVuZ3RoLCBtYXhfZGlnaXRcbiAgICAgIGQuaW5kZXggICA9ICggZGVjb2RlIG1hbnRpc3NhLCBhbHBoYWJldCApIC0gY2ZnLm1heF9pbnRlZ2VyXG4gICAgY2FzdF9wbnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSBkZWNvZGUgZC5tYW50aXNzYSwgYWxwaGFiZXRcbiAgICBjYXN0X3plcm8gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IDBcbiAgICBjYXN0X3BhZGRpbmcgID0gKHsgZGF0YTogZCwgc291cmNlLCBoaXQsIH0pIC0+IGQuaW5kZXggPSAwIGlmIHNvdXJjZSBpcyBoaXRcbiAgICBjYXN0X290aGVyICAgID0gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgPSBuZXcgR3JhbW1hciB7IGVtaXRfc2lnbmFsczogZmFsc2UsIH1cbiAgICBmaXJzdCAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaW50ZWdlcl9vcl9saXN0ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIGlmIEFycmF5LmlzQXJyYXkgaW50ZWdlcl9vcl9saXN0XG4gICAgICByZXR1cm4gKCBAZW5jb2RlIG4gZm9yIG4gaW4gaW50ZWdlcl9vcl9saXN0ICkuam9pbiAnJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbiA9IGludGVnZXJfb3JfbGlzdFxuICAgIHVubGVzcyBOdW1iZXIuaXNGaW5pdGUgblxuICAgICAgdHlwZSA9ICdYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18yIGV4cGVjdGVkIGEgZmxvYXQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBAY2ZnLm1pbl9pbnRlZ2VyIDw9IG4gPD0gQGNmZy5tYXhfaW50ZWdlclxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18zIGV4cGVjdGVkIGEgZmxvYXQgYmV0d2VlbiAje0BjZmcubWluX2ludGVnZXJ9IGFuZCAje0BjZmcubWF4X2ludGVnZXJ9LCBnb3QgI3tufVwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gQGVuY29kZV9pbnRlZ2VyIG5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuICAgICMjIyBOT1RFIGNhbGwgb25seSB3aGVyZSBhc3N1cmVkIGBuYCBpcyBpbnRlZ2VyIHdpdGhpbiBtYWduaXR1ZGUgb2YgYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYCAjIyNcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgWmVybyBvciBzbWFsbCBwb3NpdGl2ZTpcbiAgICByZXR1cm4gKCBAY2ZnLnpwdW5zLmF0IG4gKSBpZiAwICAgICAgICAgIDw9IG4gPD0gQGNmZy56cHVuX21heFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBTbWFsbCBuZWdhdGl2ZTpcbiAgICByZXR1cm4gKCBAY2ZnLm51bnMuYXQgIG4gKSBpZiBAY2ZnLm51bl9taW4gIDw9IG4gPCAgMFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBCaWcgcG9zaXRpdmU6XG4gICAgaWYgbiA+IEBjZmcuenB1bl9tYXhcbiAgICAgIFIgPSBlbmNvZGUgbiwgQGNmZy5hbHBoYWJldFxuICAgICAgcmV0dXJuICggQGNmZy5wbWFnLmF0IFIubGVuZ3RoICkgKyBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEJpZyBuZWdhdGl2ZTpcbiAgICAjIyMgTk9URSBwbHVzIG9uZSBvciBub3QgcGx1cyBvbmU/PyAjIyNcbiAgICAjIFIgPSAoIGVuY29kZSAoIG4gKyBAY2ZnLm1heF9pbnRlZ2VyICsgMSApLCBAY2ZnLmFscGhhYmV0IClcbiAgICBSID0gKCBlbmNvZGUgKCBuICsgQGNmZy5tYXhfaW50ZWdlciAgICAgKSwgQGNmZy5hbHBoYWJldCApXG4gICAgIyBkZWJ1ZyAnzqlobGxfX180JywgeyBuLCBSLCB9XG4gICAgaWYgUi5sZW5ndGggPCBAY2ZnLnplcm9fcGFkX2xlbmd0aFxuICAgICAgUiA9IFIucGFkU3RhcnQgQGNmZy56ZXJvX3BhZF9sZW5ndGgsIEBjZmcuYWxwaGFiZXQuYXQgMFxuICAgICAgIyBkZWJ1ZyAnzqlobGxfX181JywgeyBuLCBSLCB9XG4gICAgZWxzZVxuICAgICAgUiA9IFIucmVwbGFjZSBAY2ZnLmxlYWRpbmdfbmluZXJzX3JlLCAnJ1xuICAgICAgIyBkZWJ1ZyAnzqlobGxfX182JywgeyBuLCBSLCB9XG4gICAgcmV0dXJuICggQGNmZy5ubWFnLmF0IFIubGVuZ3RoICkgKyBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwYXJzZTogKCBzb3J0a2V5ICkgLT5cbiAgICBSID0gW11cbiAgICBmb3IgbGV4ZW1lIGluIEBsZXhlci5zY2FuX3RvX2xpc3Qgc29ydGtleVxuICAgICAgeyBuYW1lLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZGF0YSwgICAgICAgfSA9IGxleGVtZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB7IGxldHRlcnMsXG4gICAgICAgIG1hbnRpc3NhLFxuICAgICAgICBpbmRleCwgICAgICB9ID0gZGF0YVxuICAgICAgbGV0dGVycyAgICAgICAgID0gbGV0dGVycy5qb2luICcnIGlmICggdHlwZV9vZiBsZXR0ZXJzICkgaXMgJ2xpc3QnXG4gICAgICBtYW50aXNzYSAgICAgICA/PSBudWxsXG4gICAgICBpbmRleCAgICAgICAgICA/PSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIucHVzaCB7IG5hbWUsIGxldHRlcnMsIG1hbnRpc3NhLCBpbmRleCwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGU6ICggc29ydGtleSApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzb3J0a2V5ICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzcgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3Mgc29ydGtleS5sZW5ndGggPiAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzggZXhwZWN0ZWQgYSBub24tZW1wdHkgdGV4dCwgZ290ICN7cnByIHNvcnRrZXl9XCJcbiAgICBSID0gW11cbiAgICBmb3IgdW5pdCBpbiBAcGFyc2Ugc29ydGtleVxuICAgICAgaWYgdW5pdC5uYW1lIGlzICdvdGhlcidcbiAgICAgICAgbWVzc2FnZSAgID0gXCLOqWhsbF9fXzkgbm90IGEgdmFsaWQgc29ydGtleTogdW5hYmxlIHRvIHBhcnNlICN7cnByIHVuaXQubGV0dGVyc31cIlxuICAgICAgICBtZXNzYWdlICArPSBcIiBpbiAje3JwciBzb3J0a2V5fVwiIGlmIHNvcnRrZXkgaXNudCB1bml0LmxldHRlcnNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIG1lc3NhZ2VcbiAgICAgIFIucHVzaCB1bml0LmluZGV4IGlmIHVuaXQuaW5kZXg/XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaG9sbGVyaXRoXzEwICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMFxuICBob2xsZXJpdGhfMTBtdnAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwXG4gIGhvbGxlcml0aF8xMG12cDIgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnAyXG4gIGhvbGxlcml0aF8xMjggICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4XG4gIGhvbGxlcml0aF8xMjhiICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTI4YlxuICByZXR1cm4ge1xuICAgIEhvbGxlcml0aCxcbiAgICBob2xsZXJpdGhfMTAsXG4gICAgaG9sbGVyaXRoXzEwbXZwLFxuICAgIGhvbGxlcml0aF8xMG12cDIsXG4gICAgaG9sbGVyaXRoXzEyOCxcbiAgICBob2xsZXJpdGhfMTI4YixcbiAgICBpbnRlcm5hbHMsIH1cbiJdfQ==
