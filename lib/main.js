(function() {
  'use strict';
  var C, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128b, debug, decode, encode, internals, regex, rpr, type_of, types;

  //===========================================================================================================
  // { encodeBigInt,
  //   decodeBigInt,   } = TMP_require_encode_in_alphabet()
  SFMODULES = require('bricabrac-single-file-modules');

  ({encode, decode} = SFMODULES.unstable.require_anybase());

  ({type_of} = SFMODULES.unstable.require_type_of());

  ({
    show_no_colors: rpr
  } = SFMODULES.unstable.require_show());

  ({debug} = console);

  ({regex} = require('regex'));

  ({Grammar, Token, Lexeme} = require('interlex'));

  types = require('./types');

  ({Hollerith_typespace} = types);

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = Object.freeze({
    max_integer: Number.MAX_SAFE_INTEGER + 1,
    min_integer: Number.MIN_SAFE_INTEGER - 1,
    zpuns: 'ãäåæçèéêëìíîïðñòóôõö÷', // zero and positive uniliteral numbers
    nuns: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ', // negative          uniliteral numbers
    zpun_max: +20,
    nun_min: -20,
    zero_pad_length: 8,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    pmag: ' øùúûüýþÿ', // positive 'magnifier' for 1 to 8 positive digits
    nmag: ' ÎÍÌËÊÉÈÇ', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^2Æ*/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_128b = Object.freeze({
    max_integer: Number.MAX_SAFE_INTEGER + 1,
    min_integer: Number.MIN_SAFE_INTEGER - 1,
    zpuns: 'ãäåæçèéêëìíîïðñòóôõö÷', // zero and positive uniliteral numbers
    nuns: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ', // negative          uniliteral numbers
    zpun_max: +0,
    nun_min: -0,
    zero_pad_length: 8,
    /*                     1         2         3       */
    /*            12345678901234567890123456789012     */
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@AB' + 'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + 'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
    /* TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
     be used, thus can be freed for other(?) things */
    pmag: ' øùúûüýþÿ', // positive 'magnifier' for 1 to 8 positive digits
    nmag: ' ÎÍÌËÊÉÈÇ', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^2Æ*/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10 = Object.freeze({
    max_integer: +999,
    min_integer: -999,
    zpuns: 'ãäåæ', // zero and positive uniliteral numbers
    nuns: 'ÏÐÑ', // negative          uniliteral numbers
    zpun_max: +3,
    nun_min: -3,
    zero_pad_length: 3,
    alphabet: '0123456789',
    pmag: ' øùúûüýþÿ', // positive 'magnifier' for 1 to 8 positive digits
    nmag: ' ÎÍÌËÊÉÈÇ', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^9*(?=[0-9])/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp = Object.freeze({
    max_integer: +999,
    min_integer: -999,
    zpuns: 'N', // zero and positive uniliteral numbers
    nuns: '', // negative          uniliteral numbers
    zpun_max: +0,
    nun_min: -0,
    zero_pad_length: 3,
    alphabet: '0123456789',
    pmag: ' OPQR', // positive 'magnifier' for 1 to 8 positive digits
    nmag: ' MLKJ', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^9*(?=[0-9])/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  constants_10mvp2 = Object.freeze({
    max_integer: +999,
    min_integer: -999,
    zpuns: 'NOPQRSTUVW', // zero and positive uniliteral numbers
    nuns: 'EFGHIJKLM', // negative          uniliteral numbers
    zpun_max: +9,
    nun_min: -9,
    zero_pad_length: 3,
    alphabet: '0123456789',
    pmag: '  XYZ', // positive 'magnifier' for 1 to 8 positive digits
    nmag: '  CBA', // negative 'magnifier' for 1 to 8 negative digits
    nlead_re: /^9*(?=[0-9])/ // 'negative leader', discardable leading digits of lifted negative numbers
  });

  
  //-----------------------------------------------------------------------------------------------------------
  // constants = C = constants_128
  constants = C = constants_10;

  //-----------------------------------------------------------------------------------------------------------
  internals = Object.freeze({constants, types});

  //===========================================================================================================
  Hollerith = class Hollerith {
    //---------------------------------------------------------------------------------------------------------
    constructor(_TMP_constants) {
      var cfg;
      cfg = {..._TMP_constants};
      this.cfg = Object.freeze(cfg);
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
      R = {...hollerith_cfg_template, ...cfg};
      T = new Hollerith_typespace({
        blank: R.blank
      });
      R.blank = cfg.blank;
      R.alphabet = T.alphabet.validate(cfg.alphabet);
      R.alphabet_chrs = T.alphabet.data.alphabet_chrs;
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
      R.dimension = T.dimension.validate(cfg.dimension);
      R.max_digits = R.pmag_chrs.length - 1;
      R.max_integer = (R.base ** R.max_digits) - 1;
      R.min_integer = -max_integer;
      return R;
    }

    //---------------------------------------------------------------------------------------------------------
    compile_sortkey_lexer(cfg) {
      var R, all_zero_re, alphabet, cast_nnum, cast_nun, cast_other, cast_padding, cast_pnum, cast_pun, cast_zero, first, fit_nnum, fit_nun, fit_other, fit_padding, fit_pnum, fit_pun, fit_zero, max_digit, nmag, nmag_letters, nuns, nuns_letters, pmag, pmag_letters, puns_letters, zero_letters, zpuns;
      ({nuns, zpuns, nmag, pmag, alphabet} = cfg);
      // base              = alphabet.length
      //.....................................................................................................
      nuns_letters = nuns;
      puns_letters = zpuns.slice(1);
      nmag_letters = nmag.slice(1);
      pmag_letters = pmag.slice(1);
      zero_letters = zpuns[0];
      max_digit = alphabet.at(-1);
      //.....................................................................................................
      fit_nun = regex`(?<letters> [ ${nuns_letters} ]  )                                  `;
      fit_pun = regex`(?<letters> [ ${puns_letters} ]  )                                  `;
      fit_nnum = regex`(?<letters> [ ${nmag_letters} ]  ) (?<mantissa> [ ${alphabet}  ]* ) `;
      fit_pnum = regex`(?<letters> [ ${pmag_letters} ]  ) (?<mantissa> [ ${alphabet}  ]* ) `;
      fit_padding = regex`(?<letters> [ ${zero_letters} ]+ ) $                                `;
      fit_zero = regex`(?<letters> [ ${zero_letters} ]  (?= .* [^ ${zero_letters} ] ) )     `;
      fit_other = regex`(?<letters> .                    )                                  `;
      all_zero_re = regex`^ ${zero_letters}+ $`;
      //.....................................................................................................
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
      //.....................................................................................................
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
      //.....................................................................................................
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
        throw new Error(`Ωhll___5 expected a float, got a ${type}`);
      }
      if (!((this.cfg.min_integer <= n && n <= this.cfg.max_integer))) {
        throw new Error(`Ωhll___6 expected a float between ${this.cfg.min_integer} and ${this.cfg.max_integer}, got ${n}`);
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
      // debug 'Ωhll___7', { n, R, }
      if (R.length < this.cfg.zero_pad_length) {
        R = R.padStart(this.cfg.zero_pad_length, this.cfg.alphabet.at(0));
      } else {
        // debug 'Ωhll___8', { n, R, }
        R = R.replace(this.cfg.nlead_re, '');
      }
      // debug 'Ωhll___9', { n, R, }
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
        throw new Error(`Ωhll__10 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll__11 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll__12 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLG1CQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsU0FBQSxFQUFBLFlBQUEsRUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUEsY0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBOzs7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsTUFBRixFQUFVLE1BQVYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxLQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixDQUFBLENBQUUsbUJBQUYsQ0FBQSxHQUE0QixLQUE1QixFQWZBOzs7RUFtQkEsYUFBQSxHQUFnQixNQUFNLENBQUMsTUFBUCxDQUNkO0lBQUEsV0FBQSxFQUFjLE1BQU0sQ0FBQyxnQkFBUCxH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VixFQUhSOztRQUlBLElBQXFCLGtCQUFyQjtVQUFBLENBQUMsQ0FBQyxJQUFGLENBQU8sSUFBSSxDQUFDLEtBQVosRUFBQTs7TUFMRjtBQU1BLGFBQU87SUFiRCxDQWpKVjs7O0lBaUtFLGNBQWdCLENBQUUsQ0FBRixDQUFBLEVBQUE7O0VBbktsQixFQS9HQTs7O0VBcVJBLE1BQU0sQ0FBQyxPQUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBO0lBQUUsWUFBQSxHQUFvQixJQUFJLFNBQUosQ0FBYyxZQUFkO0lBQ3BCLGVBQUEsR0FBb0IsSUFBSSxTQUFKLENBQWMsZUFBZDtJQUNwQixnQkFBQSxHQUFvQixJQUFJLFNBQUosQ0FBYyxnQkFBZDtJQUNwQixhQUFBLEdBQW9CLElBQUksU0FBSixDQUFjLGFBQWQ7SUFDcEIsY0FBQSxHQUFvQixJQUFJLFNBQUosQ0FBYyxjQUFkO0FBQ3BCLFdBQU8sQ0FDTCxTQURLLEVBRUwsWUFGSyxFQUdMLGVBSEssRUFJTCxnQkFKSyxFQUtMLGFBTEssRUFNTCxjQU5LLEVBT0wsU0FQSztFQU5XLENBQUE7QUFyUnBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIHsgZW5jb2RlQmlnSW50LFxuIyAgIGRlY29kZUJpZ0ludCwgICB9ID0gVE1QX3JlcXVpcmVfZW5jb2RlX2luX2FscGhhYmV0KClcblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2luZ2xlLWZpbGUtbW9kdWxlcydcbnsgZW5jb2RlLCBkZWNvZGUsICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9hbnliYXNlKClcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IHJlZ2V4LCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAncmVnZXgnXG57IEdyYW1tYXJcbiAgVG9rZW5cbiAgTGV4ZW1lICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbnR5cGVzICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL3R5cGVzJ1xueyBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHR5cGVzXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4ID0gT2JqZWN0LmZyZWV6ZVxuICBtYXhfaW50ZWdlcjogIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSICsgMVxuICBtaW5faW50ZWdlcjogIE51bWJlci5NSU5fU0FGRV9JTlRFR0VSIC0gMVxuICB6cHVuczogICAgICAgICfDo8Okw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnICMgemVybyBhbmQgcG9zaXRpdmUgdW5pbGl0ZXJhbCBudW1iZXJzXG4gIG51bnM6ICAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6InICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICsyMFxuICBudW5fbWluOiAgICAgIC0yMFxuICB6ZXJvX3BhZF9sZW5ndGg6IDhcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGFscGhhYmV0OiAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIHBtYWc6ICAgICAgICAgJyDDuMO5w7rDu8O8w73DvsO/JyAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICBubWFnOiAgICAgICAgICcgw47DjcOMw4vDisOJw4jDhycgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjLDhiovICAgICAgIyAnbmVnYXRpdmUgbGVhZGVyJywgZGlzY2FyZGFibGUgbGVhZGluZyBkaWdpdHMgb2YgbGlmdGVkIG5lZ2F0aXZlIG51bWJlcnNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4YiA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiArIDFcbiAgbWluX2ludGVnZXI6ICBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUiAtIDFcbiAgenB1bnM6ICAgICAgICAnw6PDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3JyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiJyAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgenB1bl9tYXg6ICAgICArMFxuICBudW5fbWluOiAgICAgIC0wXG4gIHplcm9fcGFkX2xlbmd0aDogOFxuICAjIyMgICAgICAgICAgICAgICAgICAgICAxICAgICAgICAgMiAgICAgICAgIDMgICAgICAgIyMjXG4gICMjIyAgICAgICAgICAgIDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyICAgICAjIyNcbiAgYWxwaGFiZXQ6ICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUInICsgXFxcbiAgICAgICAgICAgICAgICAnQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW11eX2BhYmMnICsgXFxcbiAgICAgICAgICAgICAgICAnZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+wqHCosKjwqTCpScgKyBcXFxuICAgICAgICAgICAgICAgICfCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgcG1hZzogICAgICAgICAnIMO4w7nDusO7w7zDvcO+w78nICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyDDjsONw4zDi8OKw4nDiMOHJyAgIyBuZWdhdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IG5lZ2F0aXZlIGRpZ2l0c1xuICBubGVhZF9yZTogICAgIC9eMsOGKi8gICAgICAjICduZWdhdGl2ZSBsZWFkZXInLCBkaXNjYXJkYWJsZSBsZWFkaW5nIGRpZ2l0cyBvZiBsaWZ0ZWQgbmVnYXRpdmUgbnVtYmVyc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICArOTk5XG4gIG1pbl9pbnRlZ2VyOiAgLTk5OVxuICB6cHVuczogICAgICAgICfDo8Okw6XDpicgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgbnVuczogICAgICAgICAnw4/DkMORJyAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgenB1bl9tYXg6ICAgICArM1xuICBudW5fbWluOiAgICAgIC0zXG4gIHplcm9fcGFkX2xlbmd0aDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgcG1hZzogICAgICAgICAnIMO4w7nDusO7w7zDvcO+w78nICAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICBubWFnOiAgICAgICAgICcgw47DjcOMw4vDisOJw4jDhycgICAjIG5lZ2F0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggbmVnYXRpdmUgZGlnaXRzXG4gIG5sZWFkX3JlOiAgICAgL145Kig/PVswLTldKS8gICAgICAgICAjICduZWdhdGl2ZSBsZWFkZXInLCBkaXNjYXJkYWJsZSBsZWFkaW5nIGRpZ2l0cyBvZiBsaWZ0ZWQgbmVnYXRpdmUgbnVtYmVyc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICArOTk5XG4gIG1pbl9pbnRlZ2VyOiAgLTk5OVxuICB6cHVuczogICAgICAgICdOJyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICcnICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICswXG4gIG51bl9taW46ICAgICAgLTBcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBwbWFnOiAgICAgICAgICcgT1BRUicgICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyBNTEtKJyAgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjkqKD89WzAtOV0pLyAgICAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICArOTk5XG4gIG1pbl9pbnRlZ2VyOiAgLTk5OVxuICB6cHVuczogICAgICAgICdOT1BRUlNUVVZXJyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICdFRkdISUpLTE0nICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICs5XG4gIG51bl9taW46ICAgICAgLTlcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBwbWFnOiAgICAgICAgICcgIFhZWicgICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyAgQ0JBJyAgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjkqKD89WzAtOV0pLyAgICAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEyOFxuY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBjb25zdGFudHMsIHR5cGVzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIF9UTVBfY29uc3RhbnRzICkgLT5cbiAgICBjZmcgICAgICAgICAgICAgPSB7IF9UTVBfY29uc3RhbnRzLi4uLCB9XG4gICAgQGNmZyAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAdmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnOiAoIGNmZyApIC0+XG4gICAgIyMjIFZhbGlkYXRpb25zOiAjIyNcbiAgICAjIyMgRGVyaXZhdGlvbnM6ICMjI1xuICAgIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUgPVxuICAgICAgYmxhbms6ICAnXFx4MjAnXG4gICAgUiAgICAgICAgICAgICAgID0geyBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlLi4uLCBjZmcuLi4sIH1cbiAgICBUICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSB7IGJsYW5rOiBSLmJsYW5rLCB9XG4gICAgUi5ibGFuayAgICAgICAgID0gY2ZnLmJsYW5rXG4gICAgUi5hbHBoYWJldCAgICAgID0gVC5hbHBoYWJldC52YWxpZGF0ZSBjZmcuYWxwaGFiZXRcbiAgICBSLmFscGhhYmV0X2NocnMgPSBULmFscGhhYmV0LmRhdGEuYWxwaGFiZXRfY2hyc1xuICAgIFIuYmFzZSAgICAgICAgICA9IFQuYWxwaGFiZXQuZGF0YS5iYXNlXG4gICAgUi5tYWduaWZpZXJzICAgID0gVC5tYWduaWZpZXJzLnZhbGlkYXRlIGNmZy5tYWduaWZpZXJzXG4gICAgUi5wbWFnICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEucG1hZ1xuICAgIFIubm1hZyAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLm5tYWdcbiAgICBSLnBtYWdfY2hycyAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5wbWFnX2NocnNcbiAgICBSLm5tYWdfY2hycyAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5ubWFnX2NocnNcbiAgICBSLnVuaWxpdGVyYWxzICAgPSBULnVuaWxpdGVyYWxzLnZhbGlkYXRlIGNmZy51bmlsaXRlcmFsc1xuICAgIFIubnVucyAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5udW5zXG4gICAgUi56cHVucyAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLnpwdW5zXG4gICAgUi5udW5fY2hycyAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLm51bl9jaHJzXG4gICAgUi56cHVuX2NocnMgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLnpwdW5fY2hyc1xuICAgIFIuZGltZW5zaW9uICAgICA9IFQuZGltZW5zaW9uLnZhbGlkYXRlIGNmZy5kaW1lbnNpb25cbiAgICBSLm1heF9kaWdpdHMgICAgPSBSLnBtYWdfY2hycy5sZW5ndGggLSAxXG4gICAgUi5tYXhfaW50ZWdlciAgID0gKCBSLmJhc2UgKiogUi5tYXhfZGlnaXRzICkgLSAxXG4gICAgUi5taW5faW50ZWdlciAgID0gLW1heF9pbnRlZ2VyXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbXBpbGVfc29ydGtleV9sZXhlcjogKCBjZmcgKSAtPlxuICAgIHsgbnVucyxcbiAgICAgIHpwdW5zLFxuICAgICAgbm1hZyxcbiAgICAgIHBtYWcsXG4gICAgICBhbHBoYWJldCwgICAgIH0gPSBjZmdcbiAgICAjIGJhc2UgICAgICAgICAgICAgID0gYWxwaGFiZXQubGVuZ3RoXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbnVuc19sZXR0ZXJzICA9IG51bnNcbiAgICBwdW5zX2xldHRlcnMgID0genB1bnNbICAxIC4uICBdXG4gICAgbm1hZ19sZXR0ZXJzICA9IG5tYWdbICAgMSAuLiAgXVxuICAgIHBtYWdfbGV0dGVycyAgPSBwbWFnWyAgIDEgLi4gIF1cbiAgICB6ZXJvX2xldHRlcnMgID0genB1bnNbICAwICAgICBdXG4gICAgbWF4X2RpZ2l0ICAgICA9IGFscGhhYmV0LmF0IC0xXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZml0X251biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bnVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3B1biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cHVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X25udW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bm1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7YWxwaGFiZXR9ICBdKiApIFwiXG4gICAgZml0X3BudW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cG1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7YWxwaGFiZXR9ICBdKiApIFwiXG4gICAgZml0X3BhZGRpbmcgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdKyApICQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3plcm8gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdICAoPz0gLiogW14gI3t6ZXJvX2xldHRlcnN9IF0gKSApICAgICBcIlxuICAgIGZpdF9vdGhlciAgICAgPSByZWdleFwiKD88bGV0dGVycz4gLiAgICAgICAgICAgICAgICAgICAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGFsbF96ZXJvX3JlICAgPSByZWdleFwiXiAje3plcm9fbGV0dGVyc30rICRcIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGNhc3RfbnVuICAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gKCBjZmcubnVucy5pbmRleE9mIGQubGV0dGVycyApIC0gY2ZnLm51bnMubGVuZ3RoXG4gICAgY2FzdF9wdW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSArY2ZnLnpwdW5zLmluZGV4T2YgIGQubGV0dGVyc1xuICAgIGNhc3Rfbm51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPlxuICAgICAgbWFudGlzc2EgID0gZC5tYW50aXNzYS5wYWRTdGFydCBjZmcuemVyb19wYWRfbGVuZ3RoLCBtYXhfZGlnaXRcbiAgICAgIGQuaW5kZXggICA9ICggZGVjb2RlIG1hbnRpc3NhLCBhbHBoYWJldCApIC0gY2ZnLm1heF9pbnRlZ2VyXG4gICAgY2FzdF9wbnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSBkZWNvZGUgZC5tYW50aXNzYSwgYWxwaGFiZXRcbiAgICBjYXN0X3plcm8gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IDBcbiAgICBjYXN0X3BhZGRpbmcgID0gKHsgZGF0YTogZCwgc291cmNlLCBoaXQsIH0pIC0+IGQuaW5kZXggPSAwIGlmIHNvdXJjZSBpcyBoaXRcbiAgICBjYXN0X290aGVyICAgID0gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgID0gbmV3IEdyYW1tYXIgeyBlbWl0X3NpZ25hbHM6IGZhbHNlLCB9XG4gICAgZmlyc3QgICAgICAgPSBSLm5ld19sZXZlbCB7IG5hbWU6ICdmaXJzdCcsIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdudW4nLCAgICAgIGZpdDogZml0X251biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X251biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncHVuJywgICAgICBmaXQ6IGZpdF9wdW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wdW4sICAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ25udW0nLCAgICAgZml0OiBmaXRfbm51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3Rfbm51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwbnVtJywgICAgIGZpdDogZml0X3BudW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BudW0sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncGFkZGluZycsICBmaXQ6IGZpdF9wYWRkaW5nLCAgICAgICAgICAgICAgY2FzdDogY2FzdF9wYWRkaW5nLCAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3plcm8nLCAgICAgZml0OiBmaXRfemVybywgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfemVybywgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdvdGhlcicsICAgIGZpdDogZml0X290aGVyLCBtZXJnZTogJ2xpc3QnLCBjYXN0OiBjYXN0X290aGVyLCAgICB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZTogKCBpbnRlZ2VyX29yX2xpc3QgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgaWYgQXJyYXkuaXNBcnJheSBpbnRlZ2VyX29yX2xpc3RcbiAgICAgIHJldHVybiAoIEBlbmNvZGUgbiBmb3IgbiBpbiBpbnRlZ2VyX29yX2xpc3QgKS5qb2luICcnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBuID0gaW50ZWdlcl9vcl9saXN0XG4gICAgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBuXG4gICAgICB0eXBlID0gJ1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFgnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzUgZXhwZWN0ZWQgYSBmbG9hdCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIEBjZmcubWluX2ludGVnZXIgPD0gbiA8PSBAY2ZnLm1heF9pbnRlZ2VyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzYgZXhwZWN0ZWQgYSBmbG9hdCBiZXR3ZWVuICN7QGNmZy5taW5faW50ZWdlcn0gYW5kICN7QGNmZy5tYXhfaW50ZWdlcn0sIGdvdCAje259XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBAZW5jb2RlX2ludGVnZXIgblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgIyMjIE5PVEUgY2FsbCBvbmx5IHdoZXJlIGFzc3VyZWQgYG5gIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBaZXJvIG9yIHNtYWxsIHBvc2l0aXZlOlxuICAgIHJldHVybiAoIEBjZmcuenB1bnMuYXQgbiApIGlmIDAgICAgICAgICAgPD0gbiA8PSBAY2ZnLnpwdW5fbWF4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIFNtYWxsIG5lZ2F0aXZlOlxuICAgIHJldHVybiAoIEBjZmcubnVucy5hdCAgbiApIGlmIEBjZmcubnVuX21pbiAgPD0gbiA8ICAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEJpZyBwb3NpdGl2ZTpcbiAgICBpZiBuID4gQGNmZy56cHVuX21heFxuICAgICAgUiA9IGVuY29kZSBuLCBAY2ZnLmFscGhhYmV0XG4gICAgICByZXR1cm4gKCBAY2ZnLnBtYWcuYXQgUi5sZW5ndGggKSArIFJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIG5lZ2F0aXZlOlxuICAgICMjIyBOT1RFIHBsdXMgb25lIG9yIG5vdCBwbHVzIG9uZT8/ICMjI1xuICAgICMgUiA9ICggZW5jb2RlICggbiArIEBjZmcubWF4X2ludGVnZXIgKyAxICksIEBjZmcuYWxwaGFiZXQgKVxuICAgIFIgPSAoIGVuY29kZSAoIG4gKyBAY2ZnLm1heF9pbnRlZ2VyICAgICApLCBAY2ZnLmFscGhhYmV0IClcbiAgICAjIGRlYnVnICfOqWhsbF9fXzcnLCB7IG4sIFIsIH1cbiAgICBpZiBSLmxlbmd0aCA8IEBjZmcuemVyb19wYWRfbGVuZ3RoXG4gICAgICBSID0gUi5wYWRTdGFydCBAY2ZnLnplcm9fcGFkX2xlbmd0aCwgQGNmZy5hbHBoYWJldC5hdCAwXG4gICAgICAjIGRlYnVnICfOqWhsbF9fXzgnLCB7IG4sIFIsIH1cbiAgICBlbHNlXG4gICAgICBSID0gUi5yZXBsYWNlIEBjZmcubmxlYWRfcmUsICcnXG4gICAgICAjIGRlYnVnICfOqWhsbF9fXzknLCB7IG4sIFIsIH1cbiAgICByZXR1cm4gKCBAY2ZnLm5tYWcuYXQgUi5sZW5ndGggKSArIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHBhcnNlOiAoIHNvcnRrZXkgKSAtPlxuICAgIFIgPSBbXVxuICAgIGZvciBsZXhlbWUgaW4gQGxleGVyLnNjYW5fdG9fbGlzdCBzb3J0a2V5XG4gICAgICB7IG5hbWUsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBzdG9wLFxuICAgICAgICBkYXRhLCAgICAgICB9ID0gbGV4ZW1lXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIHsgbGV0dGVycyxcbiAgICAgICAgbWFudGlzc2EsXG4gICAgICAgIGluZGV4LCAgICAgIH0gPSBkYXRhXG4gICAgICBsZXR0ZXJzICAgICAgICAgPSBsZXR0ZXJzLmpvaW4gJycgaWYgKCB0eXBlX29mIGxldHRlcnMgKSBpcyAnbGlzdCdcbiAgICAgIG1hbnRpc3NhICAgICAgID89IG51bGxcbiAgICAgIGluZGV4ICAgICAgICAgID89IG51bGxcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgUi5wdXNoIHsgbmFtZSwgbGV0dGVycywgbWFudGlzc2EsIGluZGV4LCB9XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZTogKCBzb3J0a2V5ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNvcnRrZXkgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX18xMCBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBzb3J0a2V5Lmxlbmd0aCA+IDBcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX18xMSBleHBlY3RlZCBhIG5vbi1lbXB0eSB0ZXh0LCBnb3QgI3tycHIgc29ydGtleX1cIlxuICAgIFIgPSBbXVxuICAgIGZvciB1bml0IGluIEBwYXJzZSBzb3J0a2V5XG4gICAgICBpZiB1bml0Lm5hbWUgaXMgJ290aGVyJ1xuICAgICAgICBtZXNzYWdlICAgPSBcIs6paGxsX18xMiBub3QgYSB2YWxpZCBzb3J0a2V5OiB1bmFibGUgdG8gcGFyc2UgI3tycHIgdW5pdC5sZXR0ZXJzfVwiXG4gICAgICAgIG1lc3NhZ2UgICs9IFwiIGluICN7cnByIHNvcnRrZXl9XCIgaWYgc29ydGtleSBpc250IHVuaXQubGV0dGVyc1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IgbWVzc2FnZVxuICAgICAgUi5wdXNoIHVuaXQuaW5kZXggaWYgdW5pdC5pbmRleD9cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlX2ludGVnZXI6ICggbiApIC0+XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBob2xsZXJpdGhfMTAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwXG4gIGhvbGxlcml0aF8xMG12cCAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cDJcbiAgaG9sbGVyaXRoXzEyOCAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhcbiAgaG9sbGVyaXRoXzEyOGIgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhiXG4gIHJldHVybiB7XG4gICAgSG9sbGVyaXRoLFxuICAgIGhvbGxlcml0aF8xMCxcbiAgICBob2xsZXJpdGhfMTBtdnAsXG4gICAgaG9sbGVyaXRoXzEwbXZwMixcbiAgICBob2xsZXJpdGhfMTI4LFxuICAgIGhvbGxlcml0aF8xMjhiLFxuICAgIGludGVybmFscywgfVxuIl19
