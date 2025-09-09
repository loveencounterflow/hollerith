(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, get_max_integer, get_required_digits, internals, log_to_base, regex, rpr, type_of, types;

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

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = Object.freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    // zpun_max:     +20
    // nun_min:      -20
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
  constants_128_16383 = Object.freeze({
    uniliterals: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷',
    zero_pad_length: 8,
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
    dimension: 5,
    _max_integer: 999
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
      //.......................................................................................................
      if (cfg._max_integer != null) {
        R._max_integer = (T._max_integer_$x_for_$base.validate({
          x: cfg._max_integer,
          base: R.base
        })).x;
      } else {
        R._max_integer = T.create_max_integer_$x_for_$base({
          base: R.base,
          digits: R.max_digits
        });
      }
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
        mantissa = d.mantissa.padStart(cfg.zero_pad_length, max_digit);
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
        throw new Error(`Ωhll___2 expected a float, got a ${type}`);
      }
      if (!((this.cfg._min_integer <= n && n <= this.cfg._max_integer))) {
        throw new Error(`Ωhll___3 expected a float between ${this.cfg._min_integer} and ${this.cfg._max_integer}, got ${n}`);
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
    var hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_128 = new Hollerith(constants_128);
    hollerith_128_16383 = new Hollerith(constants_128_16383);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, hollerith_128_16383, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQSxtQkFBQSxFQUFBLFNBQUEsRUFBQSxXQUFBLEVBQUEsS0FBQSxFQUFBLEdBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7Ozs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxLQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixDQUFBLENBQUUsR0FBRixFQUNFLG1CQURGLENBQUEsR0FDNEIsS0FENUI7O0VBRUEsQ0FBQSxDQUFFLFlBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFuQixDQUFBLENBQTVCOztFQUNBLENBQUEsQ0FBRSxNQUFGLEVB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UEs7RUFOVyxDQUFBO0FBcFJwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGVuY29kZUJpZ0ludCxcbiMgICBkZWNvZGVCaWdJbnQsICAgfSA9IFRNUF9yZXF1aXJlX2VuY29kZV9pbl9hbHBoYWJldCgpXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBHcmFtbWFyXG4gIFRva2VuXG4gIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG50eXBlcyAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnLi90eXBlcydcbnsgQ0ZHLFxuICBIb2xsZXJpdGhfdHlwZXNwYWNlLCAgfSA9IHR5cGVzXG57IGNsZWFuX2Fzc2lnbiwgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfY2xlYW5fYXNzaWduKClcbnsgZW5jb2RlLFxuICBkZWNvZGUsXG4gIGxvZ190b19iYXNlLFxuICBnZXRfcmVxdWlyZWRfZGlnaXRzLFxuICBnZXRfbWF4X2ludGVnZXIsICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxuXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOCA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoiDDoyDDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3J1xuICAjIHpwdW5fbWF4OiAgICAgKzIwXG4gICMgbnVuX21pbjogICAgICAtMjBcbiAgemVyb19wYWRfbGVuZ3RoOiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjhfMTYzODMgPSBPYmplY3QuZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgemVyb19wYWRfbGVuZ3RoOiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgNVxuICBfbWF4X2ludGVnZXI6ICggMTI4ICoqIDIgKSAtIDEgIyAxNjM4M1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnw4/DkMORIMOjIMOkw6XDpidcbiAgenB1bl9tYXg6ICAgICArM1xuICBudW5fbWluOiAgICAgIC0zXG4gIHplcm9fcGFkX2xlbmd0aDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBPYmplY3QuZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgJ04nXG4gIHpwdW5fbWF4OiAgICAgKzBcbiAgbnVuX21pbjogICAgICAtMFxuICB6ZXJvX3BhZF9sZW5ndGg6ICAzXG4gIGFscGhhYmV0OiAgICAgJzAxMjM0NTY3ODknXG4gIG1hZ25pZmllcnM6ICAgJ0pLTE0gT1BRUidcbiAgZGltZW5zaW9uOiAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IE9iamVjdC5mcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAnRUZHSElKS0xNIE4gT1BRUlNUVVZXJ1xuICB6cHVuX21heDogICAgICs5XG4gIG51bl9taW46ICAgICAgLTlcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBtYWduaWZpZXJzOiAgICdBQkMgWFlaJ1xuICBkaW1lbnNpb246ICAgIDVcbiAgX21heF9pbnRlZ2VyOiA5OTlcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTI4XG5jb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEwXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuaW50ZXJuYWxzID0gT2JqZWN0LmZyZWV6ZSB7IGNvbnN0YW50cywgdHlwZXMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggY2ZnICkgLT5cbiAgICBjbGFzeiAgICAgICAgICAgPSBAY29uc3RydWN0b3JcbiAgICBAY2ZnICAgICAgICAgICAgPSBPYmplY3QuZnJlZXplIGNsYXN6LnZhbGlkYXRlX2FuZF9jb21waWxlX2NmZyBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAdmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnOiAoIGNmZyApIC0+XG4gICAgIyMjIFZhbGlkYXRpb25zOiAjIyNcbiAgICAjIyMgRGVyaXZhdGlvbnM6ICMjI1xuICAgIGhvbGxlcml0aF9jZmdfdGVtcGxhdGUgPVxuICAgICAgYmxhbms6ICAnXFx4MjAnXG4gICAgUiAgICAgICAgICAgICAgICAgICAgID0gY2xlYW5fYXNzaWduIHt9LCBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlLCBjZmdcbiAgICBUICAgICAgICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSB7IGJsYW5rOiBSLmJsYW5rLCB9XG4gICAgUi5hbHBoYWJldCAgICAgICAgICAgID0gVC5hbHBoYWJldC52YWxpZGF0ZSBjZmcuYWxwaGFiZXRcbiAgICBSLmFscGhhYmV0X2NocnMgICAgICAgPSBULmFscGhhYmV0LmRhdGEuYWxwaGFiZXRfY2hyc1xuICAgIFIubmluZXIgICAgICAgICAgICAgICA9IFQuYWxwaGFiZXQuZGF0YS5uaW5lclxuICAgIFIubGVhZGluZ19uaW5lcnNfcmUgICA9IFQuYWxwaGFiZXQuZGF0YS5sZWFkaW5nX25pbmVyc19yZVxuICAgIFIuYmFzZSAgICAgICAgICAgICAgICA9IFQuYWxwaGFiZXQuZGF0YS5iYXNlXG4gICAgUi5tYWduaWZpZXJzICAgICAgICAgID0gVC5tYWduaWZpZXJzLnZhbGlkYXRlIGNmZy5tYWduaWZpZXJzXG4gICAgUi5wbWFnICAgICAgICAgICAgICAgID0gVC5tYWduaWZpZXJzLmRhdGEucG1hZ1xuICAgIFIubm1hZyAgICAgICAgICAgICAgICA9IFQubWFnbmlmaWVycy5kYXRhLm5tYWdcbiAgICBSLnBtYWdfY2hycyAgICAgICAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5wbWFnX2NocnNcbiAgICBSLm5tYWdfY2hycyAgICAgICAgICAgPSBULm1hZ25pZmllcnMuZGF0YS5ubWFnX2NocnNcbiAgICBSLnVuaWxpdGVyYWxzICAgICAgICAgPSBULnVuaWxpdGVyYWxzLnZhbGlkYXRlIGNmZy51bmlsaXRlcmFsc1xuICAgIFIubnVucyAgICAgICAgICAgICAgICA9IFQudW5pbGl0ZXJhbHMuZGF0YS5udW5zXG4gICAgUi56cHVucyAgICAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLnpwdW5zXG4gICAgUi5udW5fY2hycyAgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLm51bl9jaHJzXG4gICAgUi56cHVuX2NocnMgICAgICAgICAgID0gVC51bmlsaXRlcmFscy5kYXRhLnpwdW5fY2hyc1xuICAgIFIubnVuX21pbiAgICAgICAgICAgICA9IC1SLm51bl9jaHJzLmxlbmd0aFxuICAgIFIuenB1bl9tYXggICAgICAgICAgICA9IFIuenB1bl9jaHJzLmxlbmd0aCAtIDFcbiAgICBSLmRpbWVuc2lvbiAgICAgICAgICAgPSBULmRpbWVuc2lvbi52YWxpZGF0ZSBjZmcuZGltZW5zaW9uXG4gICAgUi5tYXhfZGlnaXRzICAgICAgICAgID0gUi5wbWFnX2NocnMubGVuZ3RoIC0gMVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgY2ZnLl9tYXhfaW50ZWdlcj8gIHRoZW4gIFIuX21heF9pbnRlZ2VyICA9ICggVC5fbWF4X2ludGVnZXJfJHhfZm9yXyRiYXNlLnZhbGlkYXRlIHsgeDogY2ZnLl9tYXhfaW50ZWdlciwgYmFzZTogUi5iYXNlLCB9ICkueFxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICBSLl9tYXhfaW50ZWdlciAgPSBULmNyZWF0ZV9tYXhfaW50ZWdlcl8keF9mb3JfJGJhc2UgeyBiYXNlOiBSLmJhc2UsIGRpZ2l0czogUi5tYXhfZGlnaXRzLCB9XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9taW5faW50ZWdlciAgICAgICAgPSAtUi5fbWF4X2ludGVnZXJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMjIyBUQUlOVCB0aGlzIGNhbiBiZSBncmVhdGx5IHNpbXBsaWZpZWQgd2l0aCBUbyBEb3MgaW1wbGVtZW50ZWQgIyMjXG4gICAgUi5UTVBfYWxwaGFiZXQgID0gVC5UTVBfYWxwaGFiZXQudmFsaWRhdGUgKCBSLmFscGhhYmV0ICsgKCBcXFxuICAgICAgWyBSLm5tYWdfY2hycy4uLiwgXS5yZXZlcnNlKCkuam9pbiAnJyApICsgXFxcbiAgICAgIFIubnVucyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICArIFxcXG4gICAgICBSLnpwdW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5wbWFnICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKS5yZXBsYWNlIFRbQ0ZHXS5ibGFua19zcGxpdHRlciwgJydcbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBudW5zLFxuICAgICAgenB1bnMsXG4gICAgICBubWFnLFxuICAgICAgcG1hZyxcbiAgICAgIGFscGhhYmV0LCAgICAgfSA9IGNmZ1xuICAgICMgYmFzZSAgICAgICAgICAgICAgPSBhbHBoYWJldC5sZW5ndGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG51bnNfbGV0dGVycyAgPSBudW5zXG4gICAgcHVuc19sZXR0ZXJzICA9IHpwdW5zWyAgMSAuLiAgXVxuICAgIG5tYWdfbGV0dGVycyAgPSBubWFnWyAgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gcG1hZ1sgICAxIC4uICBdXG4gICAgemVyb19sZXR0ZXJzICA9IHpwdW5zWyAgMCAgICAgXVxuICAgIG1heF9kaWdpdCAgICAgPSBhbHBoYWJldC5hdCAtMVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZml0X251biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bnVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3B1biAgICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cHVuc19sZXR0ZXJzfSBdICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X25udW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7bm1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7YWxwaGFiZXR9ICBdKiApIFwiXG4gICAgZml0X3BudW0gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7cG1hZ19sZXR0ZXJzfSBdICApICg/PG1hbnRpc3NhPiBbICN7YWxwaGFiZXR9ICBdKiApIFwiXG4gICAgZml0X3BhZGRpbmcgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdKyApICQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgZml0X3plcm8gICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiBbICN7emVyb19sZXR0ZXJzfSBdICAoPz0gLiogW14gI3t6ZXJvX2xldHRlcnN9IF0gKSApICAgICBcIlxuICAgIGZpdF9vdGhlciAgICAgPSByZWdleFwiKD88bGV0dGVycz4gLiAgICAgICAgICAgICAgICAgICAgKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlxuICAgIGFsbF96ZXJvX3JlICAgPSByZWdleFwiXiAje3plcm9fbGV0dGVyc30rICRcIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5udW5zLmluZGV4T2YgZC5sZXR0ZXJzICkgLSBjZmcubnVucy5sZW5ndGhcbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuenB1bnMuaW5kZXhPZiAgZC5sZXR0ZXJzXG4gICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICBtYW50aXNzYSAgPSBkLm1hbnRpc3NhLnBhZFN0YXJ0IGNmZy56ZXJvX3BhZF9sZW5ndGgsIG1heF9kaWdpdFxuICAgICAgZC5pbmRleCAgID0gKCBkZWNvZGUgbWFudGlzc2EsIGFscGhhYmV0ICkgLSBjZmcuX21heF9pbnRlZ2VyXG4gICAgY2FzdF9wbnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSBkZWNvZGUgZC5tYW50aXNzYSwgYWxwaGFiZXRcbiAgICBjYXN0X3plcm8gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IDBcbiAgICBjYXN0X3BhZGRpbmcgID0gKHsgZGF0YTogZCwgc291cmNlLCBoaXQsIH0pIC0+IGQuaW5kZXggPSAwIGlmIHNvdXJjZSBpcyBoaXRcbiAgICBjYXN0X290aGVyICAgID0gbnVsbFxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgPSBuZXcgR3JhbW1hciB7IGVtaXRfc2lnbmFsczogZmFsc2UsIH1cbiAgICBmaXJzdCAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGU6ICggaW50ZWdlcl9vcl9saXN0ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIGlmIEFycmF5LmlzQXJyYXkgaW50ZWdlcl9vcl9saXN0XG4gICAgICByZXR1cm4gKCBAZW5jb2RlIG4gZm9yIG4gaW4gaW50ZWdlcl9vcl9saXN0ICkuam9pbiAnJ1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgbiA9IGludGVnZXJfb3JfbGlzdFxuICAgIHVubGVzcyBOdW1iZXIuaXNGaW5pdGUgblxuICAgICAgdHlwZSA9ICdYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYJ1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfX18yIGV4cGVjdGVkIGEgZmxvYXQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBAY2ZnLl9taW5faW50ZWdlciA8PSBuIDw9IEBjZmcuX21heF9pbnRlZ2VyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzMgZXhwZWN0ZWQgYSBmbG9hdCBiZXR3ZWVuICN7QGNmZy5fbWluX2ludGVnZXJ9IGFuZCAje0BjZmcuX21heF9pbnRlZ2VyfSwgZ290ICN7bn1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIEBlbmNvZGVfaW50ZWdlciBuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICAjIyMgTk9URSBjYWxsIG9ubHkgd2hlcmUgYXNzdXJlZCBgbmAgaXMgaW50ZWdlciB3aXRoaW4gbWFnbml0dWRlIG9mIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAgIyMjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmU6XG4gICAgcmV0dXJuICggQGNmZy56cHVucy5hdCBuICkgaWYgMCAgICAgICAgICA8PSBuIDw9IEBjZmcuenB1bl9tYXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgU21hbGwgbmVnYXRpdmU6XG4gICAgcmV0dXJuICggQGNmZy5udW5zLmF0ICBuICkgaWYgQGNmZy5udW5fbWluICA8PSBuIDwgIDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIHBvc2l0aXZlOlxuICAgIGlmIG4gPiBAY2ZnLnpwdW5fbWF4XG4gICAgICBSID0gZW5jb2RlIG4sIEBjZmcuYWxwaGFiZXRcbiAgICAgIHJldHVybiAoIEBjZmcucG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBCaWcgbmVnYXRpdmU6XG4gICAgIyMjIE5PVEUgcGx1cyBvbmUgb3Igbm90IHBsdXMgb25lPz8gIyMjXG4gICAgIyBSID0gKCBlbmNvZGUgKCBuICsgQGNmZy5fbWF4X2ludGVnZXIgKyAxICksIEBjZmcuYWxwaGFiZXQgKVxuICAgIFIgPSAoIGVuY29kZSAoIG4gKyBAY2ZnLl9tYXhfaW50ZWdlciAgICAgKSwgQGNmZy5hbHBoYWJldCApXG4gICAgIyBkZWJ1ZyAnzqlobGxfX180JywgeyBuLCBSLCB9XG4gICAgaWYgUi5sZW5ndGggPCBAY2ZnLnplcm9fcGFkX2xlbmd0aFxuICAgICAgUiA9IFIucGFkU3RhcnQgQGNmZy56ZXJvX3BhZF9sZW5ndGgsIEBjZmcuYWxwaGFiZXQuYXQgMFxuICAgICAgIyBkZWJ1ZyAnzqlobGxfX181JywgeyBuLCBSLCB9XG4gICAgZWxzZVxuICAgICAgUiA9IFIucmVwbGFjZSBAY2ZnLmxlYWRpbmdfbmluZXJzX3JlLCAnJ1xuICAgICAgIyBkZWJ1ZyAnzqlobGxfX182JywgeyBuLCBSLCB9XG4gICAgcmV0dXJuICggQGNmZy5ubWFnLmF0IFIubGVuZ3RoICkgKyBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwYXJzZTogKCBzb3J0a2V5ICkgLT5cbiAgICBSID0gW11cbiAgICBmb3IgbGV4ZW1lIGluIEBsZXhlci5zY2FuX3RvX2xpc3Qgc29ydGtleVxuICAgICAgeyBuYW1lLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZGF0YSwgICAgICAgfSA9IGxleGVtZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB7IGxldHRlcnMsXG4gICAgICAgIG1hbnRpc3NhLFxuICAgICAgICBpbmRleCwgICAgICB9ID0gZGF0YVxuICAgICAgbGV0dGVycyAgICAgICAgID0gbGV0dGVycy5qb2luICcnIGlmICggdHlwZV9vZiBsZXR0ZXJzICkgaXMgJ2xpc3QnXG4gICAgICBtYW50aXNzYSAgICAgICA/PSBudWxsXG4gICAgICBpbmRleCAgICAgICAgICA/PSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIucHVzaCB7IG5hbWUsIGxldHRlcnMsIG1hbnRpc3NhLCBpbmRleCwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGU6ICggc29ydGtleSApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzb3J0a2V5ICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzcgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3Mgc29ydGtleS5sZW5ndGggPiAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzggZXhwZWN0ZWQgYSBub24tZW1wdHkgdGV4dCwgZ290ICN7cnByIHNvcnRrZXl9XCJcbiAgICBSID0gW11cbiAgICBmb3IgdW5pdCBpbiBAcGFyc2Ugc29ydGtleVxuICAgICAgaWYgdW5pdC5uYW1lIGlzICdvdGhlcidcbiAgICAgICAgbWVzc2FnZSAgID0gXCLOqWhsbF9fXzkgbm90IGEgdmFsaWQgc29ydGtleTogdW5hYmxlIHRvIHBhcnNlICN7cnByIHVuaXQubGV0dGVyc31cIlxuICAgICAgICBtZXNzYWdlICArPSBcIiBpbiAje3JwciBzb3J0a2V5fVwiIGlmIHNvcnRrZXkgaXNudCB1bml0LmxldHRlcnNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIG1lc3NhZ2VcbiAgICAgIFIucHVzaCB1bml0LmluZGV4IGlmIHVuaXQuaW5kZXg/XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaG9sbGVyaXRoXzEwICAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwXG4gIGhvbGxlcml0aF8xMG12cCAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cFxuICBob2xsZXJpdGhfMTBtdnAyICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnAyXG4gIGhvbGxlcml0aF8xMjggICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhcbiAgaG9sbGVyaXRoXzEyOF8xNjM4MyA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOF8xNjM4M1xuICByZXR1cm4ge1xuICAgIEhvbGxlcml0aCxcbiAgICBob2xsZXJpdGhfMTAsXG4gICAgaG9sbGVyaXRoXzEwbXZwLFxuICAgIGhvbGxlcml0aF8xMG12cDIsXG4gICAgaG9sbGVyaXRoXzEyOCxcbiAgICBob2xsZXJpdGhfMTI4XzE2MzgzLFxuICAgIGludGVybmFscywgfVxuIl19
