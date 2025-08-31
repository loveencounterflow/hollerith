(function() {
  'use strict';
  var C, Grammar, Hollerith, Lexeme, SFMODULES, Token, Type, Typespace, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128b, debug, decode, encode, internals, regex, rpr, ts, type_of;

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

  ({debug} = console);

  //===========================================================================================================
  Type = class Type {
    //---------------------------------------------------------------------------------------------------------
    constructor(tspace, isa) {
      //---------------------------------------------------------------------------------------------------------
      this.isa = this.isa.bind(this);
      this.ts = ts;
      this._isa = isa;
      this._ctx = Object.create(this);
      this.data = {};
      return void 0;
    }

    isa(...P) {
      return this._isa.call(this._ctx, x);
    }

  };

  //===========================================================================================================
  Typespace = class Typespace {
    //---------------------------------------------------------------------------------------------------------
    constructor() {
      var clasz, i, isa, len, name, ref;
      clasz = this.constructor;
      ref = Object.getOwnPropertyNames(clasz);
      for (i = 0, len = ref.length; i < len; i++) {
        name = ref[i];
        this[name] = new Type(this, isa = clasz[name]);
      }
      return void 0;
    }

    //=========================================================================================================
    static text(x) {
      return (type_of(x)) === 'text';
    }

    static nonempy_text(x) {
      return (this.ts.text.isa(x)) && x.length > 0;
    }

    static float(x) {
      return Number.isFinite(x);
    }

    static integer(x) {
      return Number.isSafeInteger(x);
    }

    static pinteger(x) {
      return (this.ts.integer.isa(x)) && x > 0;
    }

    static zpinteger(x) {
      return (this.ts.integer.isa(x)) && x >= 0;
    }

    static cardinal(x) {
      return this.ts.zpinteger.isa(x);
    }

    //---------------------------------------------------------------------------------------------------------
    static moninc_chrs(x) {
      var chr, chrs, i, idx, len, prv_chr;
      if (!this.ts.nonempy_text(x)) {
        return false;
      }
      this.data.chrs = chrs = Array.split(x);
      prv_chr = null;
      for (idx = i = 0, len = chrs.length; i < len; idx = ++i) {
        chr = chrs[idx];
        if (prv_chr == null) {
          continue;
        }
        if (!(prv_chr < chr)) {
          return false;
        }
        prv_chr = chr;
      }
      return true;
    }

    //---------------------------------------------------------------------------------------------------------
    static dimension(x) {
      return this.ts.pinteger.isa(x);
    }

    //---------------------------------------------------------------------------------------------------------
    static nmag_bare_reversed(x) {
      if (!this.ts.nonempy_text(x)) {
        return false;
      }
    }

    //---------------------------------------------------------------------------------------------------------
    static pmag_bare(x) {}

    //---------------------------------------------------------------------------------------------------------
    static magnifiers(x) {
      var nmag, nmag_bare_reversed, pmag, pmag_bare;
      if (!this.ts.nonempy_text.isa(x)) {
        return false;
      }
      [nmag_bare_reversed, pmag_bare] = x.split(/\s+/);
      if (!this.ts.nmag_bare_reversed(nmag_bare_reversed)) {
        return false;
      }
      if (!this.ts.pmag_bare(pmag_bare)) {
        return false;
      }
      nmag = ' ' + nmag_bare_reversed.reverse();
      return pmag = ' ' + pmag_bare;
    }

  };

  ts = new Typespace();

  debug('Ωhll___1', ts);

  debug('Ωhll___2', ts.nonempy_text.isa(8));

  debug('Ωhll___3', ts.nonempy_text.isa(''));

  debug('Ωhll___4', ts.nonempy_text.isa('yes'));

  process.exit(111);

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
  internals = Object.freeze({constants});

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
    validate_and_compile_cfg(cfg) {
      /*
      max_integer:  +999            # TO BE DERIVED
      min_integer:  -999            # TO BE DERIVED
      zpuns:        'NOPQRSTUVW'    #                           # zero and positive uniliteral numbers
      nuns:         'EFGHIJKLM'     #                           # negative          uniliteral numbers
      zpun_max:     +9              # TO BE DERIVED             # biggest   number representable as uniliteral
      nun_min:      -9              # TO BE DERIVED             # smallest  number representable as uniliteral
      dimension:     3              #                           # number of indices supported
      zero_pad_length:  3           # TO BE DERIVED from number of places supported
      alphabet:     '0123456789'
      base:         10              # TO BE DERIVED from length of alphabet
      magnifiers:   'ABC XYZ'
      pmag:         '  XYZ'         # TO BE DERIVED from magnifiers  # positive 'magnifier' for 1 to 8 positive digits
      nmag:         '  CBA'         # TO BE DERIVED from magnifiers  # negative 'magnifier' for 1 to 8 negative digits
      nlead_re:     /^9*(?=[0-9])/  # TO BE DERIVED             # 'negative leader', discardable leading digits of lifted negative numbers

      * no codepoint is repeated
      * only codepoints between U+0000 and U+10ffff are supported;
        * **NOTE** this needs re-writing string index access to array index access
      * all codepoints must be be given in monotonically ascending order

       */
      /* Validations: */
      /* Derivations: */
      var base, max_integer, min_integer, nmag, nmag_bare, nmag_bare_reversed, pmag;
      base = alphabet.length;
      [nmag_bare_reversed, nmag_bare] = magnifiers.split(/\s+/);
      nmag = ' ' + nmag_bare_reversed.reverse();
      pmag = ' ' + pmag_bare;
      max_integer = (base ** dimension) - 1;
      min_integer = -max_integer;
      return min_integer = -max_integer;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLFlBQUEsRUFBQSxlQUFBLEVBQUEsZ0JBQUEsRUFBQSxhQUFBLEVBQUEsY0FBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLEVBQUEsRUFBQSxPQUFBOzs7OztFQUtBLFNBQUEsR0FBNEIsT0FBQSxDQUFRLCtCQUFSOztFQUM1QixDQUFBLENBQUUsTUFBRixFQUFVLE1BQVYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCLEVBZEE7OztFQWtCTSxPQUFOLE1BQUEsS0FBQSxDQUFBOztJQUdFLFdBQWEsQ0FBRSxNQUFGLEVBQVUsR0FBVixDQUFBLEVBQUE7O1VBUWIsQ0FBQSxVQUFBLENBQUE7TUFQRSxJ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SUFBRixDQUFPLElBQUksQ0FBQyxLQUFaLEVBQUE7O01BTEY7QUFNQSxhQUFPO0lBYkQsQ0ExSlY7OztJQTBLRSxjQUFnQixDQUFFLENBQUYsQ0FBQSxFQUFBOztFQTVLbEIsRUFwTEE7OztFQW1XQSxNQUFNLENBQUMsT0FBUCxHQUFvQixDQUFBLENBQUEsQ0FBQSxHQUFBO0FBQ3BCLFFBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQTtJQUFFLFlBQUEsR0FBb0IsSUFBSSxTQUFKLENBQWMsWUFBZDtJQUNwQixlQUFBLEdBQW9CLElBQUksU0FBSixDQUFjLGVBQWQ7SUFDcEIsZ0JBQUEsR0FBb0IsSUFBSSxTQUFKLENBQWMsZ0JBQWQ7SUFDcEIsYUFBQSxHQUFvQixJQUFJLFNBQUosQ0FBYyxhQUFkO0lBQ3BCLGNBQUEsR0FBb0IsSUFBSSxTQUFKLENBQWMsY0FBZDtBQUNwQixXQUFPLENBQ0wsU0FESyxFQUVMLFlBRkssRUFHTCxlQUhLLEVBSUwsZ0JBSkssRUFLTCxhQUxLLEVBTUwsY0FOSyxFQU9MLFNBUEs7RUFOVyxDQUFBO0FBbldwQiIsInNvdXJjZXNDb250ZW50IjpbIlxuJ3VzZSBzdHJpY3QnXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyB7IGVuY29kZUJpZ0ludCxcbiMgICBkZWNvZGVCaWdJbnQsICAgfSA9IFRNUF9yZXF1aXJlX2VuY29kZV9pbl9hbHBoYWJldCgpXG5TRk1PRFVMRVMgICAgICAgICAgICAgICAgID0gcmVxdWlyZSAnYnJpY2FicmFjLXNpbmdsZS1maWxlLW1vZHVsZXMnXG57IGVuY29kZSwgZGVjb2RlLCAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG57IHR5cGVfb2YsICAgICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfdHlwZV9vZigpXG57IHNob3dfbm9fY29sb3JzOiBycHIsICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfc2hvdygpXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxueyByZWdleCwgICAgICAgICAgICAgICAgfSA9IHJlcXVpcmUgJ3JlZ2V4J1xueyBHcmFtbWFyXG4gIFRva2VuXG4gIExleGVtZSAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAnaW50ZXJsZXgnXG57IGRlYnVnLCAgICAgICAgICAgICAgICB9ID0gY29uc29sZVxuXG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgVHlwZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggdHNwYWNlLCBpc2EgKSAtPlxuICAgIEB0cyAgICAgPSB0c1xuICAgIEBfaXNhICAgPSBpc2FcbiAgICBAX2N0eCAgID0gT2JqZWN0LmNyZWF0ZSBAXG4gICAgQGRhdGEgICA9IHt9XG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaXNhOiAoIFAuLi4gKSA9PiBAX2lzYS5jYWxsIEBfY3R4LCB4XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgVHlwZXNwYWNlXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBjbGFzeiA9IEBjb25zdHJ1Y3RvclxuICAgIGZvciBuYW1lIGluIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIGNsYXN6XG4gICAgICBAWyBuYW1lIF0gPSBuZXcgVHlwZSBALCBpc2EgPSBjbGFzelsgbmFtZSBdXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuXG4gICM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgQHRleHQ6ICAgICAgICAgICAoIHggKSAtPiAoIHR5cGVfb2YgeCApIGlzICd0ZXh0J1xuICBAbm9uZW1weV90ZXh0OiAgICggeCApIC0+ICggQHRzLnRleHQuaXNhIHggKSBhbmQgeC5sZW5ndGggPiAwXG4gIEBmbG9hdDogICAgICAgICAgKCB4ICkgLT4gTnVtYmVyLmlzRmluaXRlIHhcbiAgQGludGVnZXI6ICAgICAgICAoIHggKSAtPiBOdW1iZXIuaXNTYWZlSW50ZWdlciB4XG4gIEBwaW50ZWdlcjogICAgICAgKCB4ICkgLT4gKCBAdHMuaW50ZWdlci5pc2EgeCApIGFuZCB4ID4gMFxuICBAenBpbnRlZ2VyOiAgICAgICggeCApIC0+ICggQHRzLmludGVnZXIuaXNhIHggKSBhbmQgeCA+PSAwXG4gIEBjYXJkaW5hbDogICAgICAgKCB4ICkgLT4gQHRzLnpwaW50ZWdlci5pc2EgeFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQG1vbmluY19jaHJzOiAoIHggKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHRzLm5vbmVtcHlfdGV4dCB4XG4gICAgQGRhdGEuY2hycyA9IGNocnMgPSBBcnJheS5zcGxpdCB4XG4gICAgcHJ2X2NociAgICA9IG51bGxcbiAgICBmb3IgY2hyLCBpZHggaW4gY2hyc1xuICAgICAgY29udGludWUgdW5sZXNzIHBydl9jaHI/XG4gICAgICByZXR1cm4gZmFsc2UgdW5sZXNzIHBydl9jaHIgPCBjaHJcbiAgICAgIHBydl9jaHIgPSBjaHJcbiAgICByZXR1cm4gdHJ1ZVxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQGRpbWVuc2lvbjogICAgICAoIHggKSAtPiBAdHMucGludGVnZXIuaXNhICB4XG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBAbm1hZ19iYXJlX3JldmVyc2VkOiAoIHggKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHRzLm5vbmVtcHlfdGV4dCB4XG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgQHBtYWdfYmFyZTogKCB4ICkgLT5cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBtYWduaWZpZXJzOiAoIHggKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgQHRzLm5vbmVtcHlfdGV4dC5pc2EgeFxuICAgIFsgbm1hZ19iYXJlX3JldmVyc2VkLFxuICAgICAgcG1hZ19iYXJlLCAgXSA9IHguc3BsaXQgL1xccysvXG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyBAdHMubm1hZ19iYXJlX3JldmVyc2VkICBubWFnX2JhcmVfcmV2ZXJzZWRcbiAgICByZXR1cm4gZmFsc2UgdW5sZXNzIEB0cy5wbWFnX2JhcmUgICAgICAgICAgIHBtYWdfYmFyZVxuICAgIG5tYWcgICAgICAgICAgICA9ICcgJyArIG5tYWdfYmFyZV9yZXZlcnNlZC5yZXZlcnNlKClcbiAgICBwbWFnICAgICAgICAgICAgPSAnICcgKyBwbWFnX2JhcmVcblxudHMgPSBuZXcgVHlwZXNwYWNlKClcbmRlYnVnICfOqWhsbF9fXzEnLCB0c1xuZGVidWcgJ86paGxsX19fMicsIHRzLm5vbmVtcHlfdGV4dC5pc2EgOFxuZGVidWcgJ86paGxsX19fMycsIHRzLm5vbmVtcHlfdGV4dC5pc2EgJydcbmRlYnVnICfOqWhsbF9fXzQnLCB0cy5ub25lbXB5X3RleHQuaXNhICd5ZXMnXG5wcm9jZXNzLmV4aXQgMTExXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOCA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiArIDFcbiAgbWluX2ludGVnZXI6ICBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUiAtIDFcbiAgenB1bnM6ICAgICAgICAnw6PDpMOlw6bDp8Oow6nDqsOrw6zDrcOuw6/DsMOxw7LDs8O0w7XDtsO3JyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiJyAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgenB1bl9tYXg6ICAgICArMjBcbiAgbnVuX21pbjogICAgICAtMjBcbiAgemVyb19wYWRfbGVuZ3RoOiA4XG4gICMjIyAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBhbHBoYWJldDogICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBwbWFnOiAgICAgICAgICcgw7jDucO6w7vDvMO9w77DvycgICMgcG9zaXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBwb3NpdGl2ZSBkaWdpdHNcbiAgbm1hZzogICAgICAgICAnIMOOw43DjMOLw4rDicOIw4cnICAjIG5lZ2F0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggbmVnYXRpdmUgZGlnaXRzXG4gIG5sZWFkX3JlOiAgICAgL14yw4YqLyAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOGIgPSBPYmplY3QuZnJlZXplXG4gIG1heF9pbnRlZ2VyOiAgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgKyAxXG4gIG1pbl9pbnRlZ2VyOiAgTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIgLSAxXG4gIHpwdW5zOiAgICAgICAgJ8Ojw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtycgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgbnVuczogICAgICAgICAnw4/DkMORw5LDk8OUw5XDlsOXw5jDmcOaw5vDnMOdw57Dn8Ogw6HDoicgICMgbmVnYXRpdmUgICAgICAgICAgdW5pbGl0ZXJhbCBudW1iZXJzXG4gIHpwdW5fbWF4OiAgICAgKzBcbiAgbnVuX21pbjogICAgICAtMFxuICB6ZXJvX3BhZF9sZW5ndGg6IDhcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGFscGhhYmV0OiAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIHBtYWc6ICAgICAgICAgJyDDuMO5w7rDu8O8w73DvsO/JyAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICBubWFnOiAgICAgICAgICcgw47DjcOMw4vDisOJw4jDhycgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjLDhiovICAgICAgIyAnbmVnYXRpdmUgbGVhZGVyJywgZGlzY2FyZGFibGUgbGVhZGluZyBkaWdpdHMgb2YgbGlmdGVkIG5lZ2F0aXZlIG51bWJlcnNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTAgPSBPYmplY3QuZnJlZXplXG4gIG1heF9pbnRlZ2VyOiAgKzk5OVxuICBtaW5faW50ZWdlcjogIC05OTlcbiAgenB1bnM6ICAgICAgICAnw6PDpMOlw6YnICMgemVybyBhbmQgcG9zaXRpdmUgdW5pbGl0ZXJhbCBudW1iZXJzXG4gIG51bnM6ICAgICAgICAgJ8OPw5DDkScgICMgbmVnYXRpdmUgICAgICAgICAgdW5pbGl0ZXJhbCBudW1iZXJzXG4gIHpwdW5fbWF4OiAgICAgKzNcbiAgbnVuX21pbjogICAgICAtM1xuICB6ZXJvX3BhZF9sZW5ndGg6ICAzXG4gIGFscGhhYmV0OiAgICAgJzAxMjM0NTY3ODknXG4gIHBtYWc6ICAgICAgICAgJyDDuMO5w7rDu8O8w73DvsO/JyAgICMgcG9zaXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBwb3NpdGl2ZSBkaWdpdHNcbiAgbm1hZzogICAgICAgICAnIMOOw43DjMOLw4rDicOIw4cnICAgIyBuZWdhdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IG5lZ2F0aXZlIGRpZ2l0c1xuICBubGVhZF9yZTogICAgIC9eOSooPz1bMC05XSkvICAgICAgICAgIyAnbmVnYXRpdmUgbGVhZGVyJywgZGlzY2FyZGFibGUgbGVhZGluZyBkaWdpdHMgb2YgbGlmdGVkIG5lZ2F0aXZlIG51bWJlcnNcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBPYmplY3QuZnJlZXplXG4gIG1heF9pbnRlZ2VyOiAgKzk5OVxuICBtaW5faW50ZWdlcjogIC05OTlcbiAgenB1bnM6ICAgICAgICAnTicgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgbnVuczogICAgICAgICAnJyAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgenB1bl9tYXg6ICAgICArMFxuICBudW5fbWluOiAgICAgIC0wXG4gIHplcm9fcGFkX2xlbmd0aDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgcG1hZzogICAgICAgICAnIE9QUVInICAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICBubWFnOiAgICAgICAgICcgTUxLSicgICAjIG5lZ2F0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggbmVnYXRpdmUgZGlnaXRzXG4gIG5sZWFkX3JlOiAgICAgL145Kig/PVswLTldKS8gICAgICAgICAjICduZWdhdGl2ZSBsZWFkZXInLCBkaXNjYXJkYWJsZSBsZWFkaW5nIGRpZ2l0cyBvZiBsaWZ0ZWQgbmVnYXRpdmUgbnVtYmVyc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cDIgPSBPYmplY3QuZnJlZXplXG4gIG1heF9pbnRlZ2VyOiAgKzk5OVxuICBtaW5faW50ZWdlcjogIC05OTlcbiAgenB1bnM6ICAgICAgICAnTk9QUVJTVFVWVycgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgbnVuczogICAgICAgICAnRUZHSElKS0xNJyAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgenB1bl9tYXg6ICAgICArOVxuICBudW5fbWluOiAgICAgIC05XG4gIHplcm9fcGFkX2xlbmd0aDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgcG1hZzogICAgICAgICAnICBYWVonICAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICBubWFnOiAgICAgICAgICcgIENCQScgICAjIG5lZ2F0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggbmVnYXRpdmUgZGlnaXRzXG4gIG5sZWFkX3JlOiAgICAgL145Kig/PVswLTldKS8gICAgICAgICAjICduZWdhdGl2ZSBsZWFkZXInLCBkaXNjYXJkYWJsZSBsZWFkaW5nIGRpZ2l0cyBvZiBsaWZ0ZWQgbmVnYXRpdmUgbnVtYmVyc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMjhcbmNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbnRlcm5hbHMgPSBPYmplY3QuZnJlZXplIHsgY29uc3RhbnRzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIF9UTVBfY29uc3RhbnRzICkgLT5cbiAgICBjZmcgICAgICAgICAgICAgPSB7IF9UTVBfY29uc3RhbnRzLi4uLCB9XG4gICAgQGNmZyAgICAgICAgICAgID0gT2JqZWN0LmZyZWV6ZSBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICByZXR1cm4gdW5kZWZpbmVkXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB2YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmc6ICggY2ZnICkgLT5cbiAgICAjIyNcbiAgICBtYXhfaW50ZWdlcjogICs5OTkgICAgICAgICAgICAjIFRPIEJFIERFUklWRURcbiAgICBtaW5faW50ZWdlcjogIC05OTkgICAgICAgICAgICAjIFRPIEJFIERFUklWRURcbiAgICB6cHVuczogICAgICAgICdOT1BRUlNUVVZXJyAgICAjICAgICAgICAgICAgICAgICAgICAgICAgICAgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgICBudW5zOiAgICAgICAgICdFRkdISUpLTE0nICAgICAjICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgICB6cHVuX21heDogICAgICs5ICAgICAgICAgICAgICAjIFRPIEJFIERFUklWRUQgICAgICAgICAgICAgIyBiaWdnZXN0ICAgbnVtYmVyIHJlcHJlc2VudGFibGUgYXMgdW5pbGl0ZXJhbFxuICAgIG51bl9taW46ICAgICAgLTkgICAgICAgICAgICAgICMgVE8gQkUgREVSSVZFRCAgICAgICAgICAgICAjIHNtYWxsZXN0ICBudW1iZXIgcmVwcmVzZW50YWJsZSBhcyB1bmlsaXRlcmFsXG4gICAgZGltZW5zaW9uOiAgICAgMyAgICAgICAgICAgICAgIyAgICAgICAgICAgICAgICAgICAgICAgICAgICMgbnVtYmVyIG9mIGluZGljZXMgc3VwcG9ydGVkXG4gICAgemVyb19wYWRfbGVuZ3RoOiAgMyAgICAgICAgICAgIyBUTyBCRSBERVJJVkVEIGZyb20gbnVtYmVyIG9mIHBsYWNlcyBzdXBwb3J0ZWRcbiAgICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICAgIGJhc2U6ICAgICAgICAgMTAgICAgICAgICAgICAgICMgVE8gQkUgREVSSVZFRCBmcm9tIGxlbmd0aCBvZiBhbHBoYWJldFxuICAgIG1hZ25pZmllcnM6ICAgJ0FCQyBYWVonXG4gICAgcG1hZzogICAgICAgICAnICBYWVonICAgICAgICAgIyBUTyBCRSBERVJJVkVEIGZyb20gbWFnbmlmaWVycyAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICAgIG5tYWc6ICAgICAgICAgJyAgQ0JBJyAgICAgICAgICMgVE8gQkUgREVSSVZFRCBmcm9tIG1hZ25pZmllcnMgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgICBubGVhZF9yZTogICAgIC9eOSooPz1bMC05XSkvICAjIFRPIEJFIERFUklWRUQgICAgICAgICAgICAgIyAnbmVnYXRpdmUgbGVhZGVyJywgZGlzY2FyZGFibGUgbGVhZGluZyBkaWdpdHMgb2YgbGlmdGVkIG5lZ2F0aXZlIG51bWJlcnNcblxuICAgICogbm8gY29kZXBvaW50IGlzIHJlcGVhdGVkXG4gICAgKiBvbmx5IGNvZGVwb2ludHMgYmV0d2VlbiBVKzAwMDAgYW5kIFUrMTBmZmZmIGFyZSBzdXBwb3J0ZWQ7XG4gICAgICAqICoqTk9URSoqIHRoaXMgbmVlZHMgcmUtd3JpdGluZyBzdHJpbmcgaW5kZXggYWNjZXNzIHRvIGFycmF5IGluZGV4IGFjY2Vzc1xuICAgICogYWxsIGNvZGVwb2ludHMgbXVzdCBiZSBiZSBnaXZlbiBpbiBtb25vdG9uaWNhbGx5IGFzY2VuZGluZyBvcmRlclxuXG5cbiAgICAjIyNcbiAgICAjIyMgVmFsaWRhdGlvbnM6ICMjI1xuICAgICMjIyBEZXJpdmF0aW9uczogIyMjXG5cbiAgICAgIGJhc2UgICAgICAgICAgICA9IGFscGhhYmV0Lmxlbmd0aFxuICAgICAgWyBubWFnX2JhcmVfcmV2ZXJzZWQsXG4gICAgICAgIG5tYWdfYmFyZSwgIF0gPSBtYWduaWZpZXJzLnNwbGl0IC9cXHMrL1xuICAgICAgbm1hZyAgICAgICAgICAgID0gJyAnICsgbm1hZ19iYXJlX3JldmVyc2VkLnJldmVyc2UoKVxuICAgICAgcG1hZyAgICAgICAgICAgID0gJyAnICsgcG1hZ19iYXJlXG4gICAgICBtYXhfaW50ZWdlciAgICAgPSAoIGJhc2UgKiogZGltZW5zaW9uICkgLSAxXG4gICAgICBtaW5faW50ZWdlciAgICAgPSAtbWF4X2ludGVnZXJcbiAgICAgIG1pbl9pbnRlZ2VyICAgICA9IC1tYXhfaW50ZWdlclxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29tcGlsZV9zb3J0a2V5X2xleGVyOiAoIGNmZyApIC0+XG4gICAgeyBudW5zLFxuICAgICAgenB1bnMsXG4gICAgICBubWFnLFxuICAgICAgcG1hZyxcbiAgICAgIGFscGhhYmV0LCAgICAgfSA9IGNmZ1xuICAgICMgYmFzZSAgICAgICAgICAgICAgPSBhbHBoYWJldC5sZW5ndGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBudW5zX2xldHRlcnMgID0gbnVuc1xuICAgIHB1bnNfbGV0dGVycyAgPSB6cHVuc1sgIDEgLi4gIF1cbiAgICBubWFnX2xldHRlcnMgID0gbm1hZ1sgICAxIC4uICBdXG4gICAgcG1hZ19sZXR0ZXJzICA9IHBtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSB6cHVuc1sgIDAgICAgIF1cbiAgICBtYXhfZGlnaXQgICAgID0gYWxwaGFiZXQuYXQgLTFcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmaXRfbnVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tudW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfcHVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twdW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfbm51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tubWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3thbHBoYWJldH0gIF0qICkgXCJcbiAgICBmaXRfcG51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twbWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3thbHBoYWJldH0gIF0qICkgXCJcbiAgICBmaXRfcGFkZGluZyAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0rICkgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfemVybyAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0gICg/PSAuKiBbXiAje3plcm9fbGV0dGVyc30gXSApICkgICAgIFwiXG4gICAgZml0X290aGVyICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiAuICAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgYWxsX3plcm9fcmUgICA9IHJlZ2V4XCJeICN7emVyb19sZXR0ZXJzfSsgJFwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgY2FzdF9udW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAoIGNmZy5udW5zLmluZGV4T2YgZC5sZXR0ZXJzICkgLSBjZmcubnVucy5sZW5ndGhcbiAgICBjYXN0X3B1biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICtjZmcuenB1bnMuaW5kZXhPZiAgZC5sZXR0ZXJzXG4gICAgY2FzdF9ubnVtICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+XG4gICAgICBtYW50aXNzYSAgPSBkLm1hbnRpc3NhLnBhZFN0YXJ0IGNmZy56ZXJvX3BhZF9sZW5ndGgsIG1heF9kaWdpdFxuICAgICAgZC5pbmRleCAgID0gKCBkZWNvZGUgbWFudGlzc2EsIGFscGhhYmV0ICkgLSBjZmcubWF4X2ludGVnZXJcbiAgICBjYXN0X3BudW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9IGRlY29kZSBkLm1hbnRpc3NhLCBhbHBoYWJldFxuICAgIGNhc3RfemVybyAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gMFxuICAgIGNhc3RfcGFkZGluZyAgPSAoeyBkYXRhOiBkLCBzb3VyY2UsIGhpdCwgfSkgLT4gZC5pbmRleCA9IDAgaWYgc291cmNlIGlzIGhpdFxuICAgIGNhc3Rfb3RoZXIgICAgPSBudWxsXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgUiAgICAgICAgICAgPSBuZXcgR3JhbW1hciB7IGVtaXRfc2lnbmFsczogZmFsc2UsIH1cbiAgICBmaXJzdCAgICAgICA9IFIubmV3X2xldmVsIHsgbmFtZTogJ2ZpcnN0JywgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ251bicsICAgICAgZml0OiBmaXRfbnVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfbnVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwdW4nLCAgICAgIGZpdDogZml0X3B1biwgICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3B1biwgICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbm51bScsICAgICBmaXQ6IGZpdF9ubnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9ubnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BudW0nLCAgICAgZml0OiBmaXRfcG51bSwgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcG51bSwgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdwYWRkaW5nJywgIGZpdDogZml0X3BhZGRpbmcsICAgICAgICAgICAgICBjYXN0OiBjYXN0X3BhZGRpbmcsICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnemVybycsICAgICBmaXQ6IGZpdF96ZXJvLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF96ZXJvLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ290aGVyJywgICAgZml0OiBmaXRfb3RoZXIsIG1lcmdlOiAnbGlzdCcsIGNhc3Q6IGNhc3Rfb3RoZXIsICAgIH1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlOiAoIGludGVnZXJfb3JfbGlzdCApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICBpZiBBcnJheS5pc0FycmF5IGludGVnZXJfb3JfbGlzdFxuICAgICAgcmV0dXJuICggQGVuY29kZSBuIGZvciBuIGluIGludGVnZXJfb3JfbGlzdCApLmpvaW4gJydcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG4gPSBpbnRlZ2VyX29yX2xpc3RcbiAgICB1bmxlc3MgTnVtYmVyLmlzRmluaXRlIG5cbiAgICAgIHR5cGUgPSAnWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNSBleHBlY3RlZCBhIGZsb2F0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3MgQGNmZy5taW5faW50ZWdlciA8PSBuIDw9IEBjZmcubWF4X2ludGVnZXJcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNiBleHBlY3RlZCBhIGZsb2F0IGJldHdlZW4gI3tAY2ZnLm1pbl9pbnRlZ2VyfSBhbmQgI3tAY2ZnLm1heF9pbnRlZ2VyfSwgZ290ICN7bn1cIlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIEBlbmNvZGVfaW50ZWdlciBuXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBlbmNvZGVfaW50ZWdlcjogKCBuICkgLT5cbiAgICAjIyMgTk9URSBjYWxsIG9ubHkgd2hlcmUgYXNzdXJlZCBgbmAgaXMgaW50ZWdlciB3aXRoaW4gbWFnbml0dWRlIG9mIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAgIyMjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIFplcm8gb3Igc21hbGwgcG9zaXRpdmU6XG4gICAgcmV0dXJuICggQGNmZy56cHVucy5hdCBuICkgaWYgMCAgICAgICAgICA8PSBuIDw9IEBjZmcuenB1bl9tYXhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgU21hbGwgbmVnYXRpdmU6XG4gICAgcmV0dXJuICggQGNmZy5udW5zLmF0ICBuICkgaWYgQGNmZy5udW5fbWluICA8PSBuIDwgIDBcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIHBvc2l0aXZlOlxuICAgIGlmIG4gPiBAY2ZnLnpwdW5fbWF4XG4gICAgICBSID0gZW5jb2RlIG4sIEBjZmcuYWxwaGFiZXRcbiAgICAgIHJldHVybiAoIEBjZmcucG1hZy5hdCBSLmxlbmd0aCApICsgUlxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBCaWcgbmVnYXRpdmU6XG4gICAgIyMjIE5PVEUgcGx1cyBvbmUgb3Igbm90IHBsdXMgb25lPz8gIyMjXG4gICAgIyBSID0gKCBlbmNvZGUgKCBuICsgQGNmZy5tYXhfaW50ZWdlciArIDEgKSwgQGNmZy5hbHBoYWJldCApXG4gICAgUiA9ICggZW5jb2RlICggbiArIEBjZmcubWF4X2ludGVnZXIgICAgICksIEBjZmcuYWxwaGFiZXQgKVxuICAgICMgZGVidWcgJ86paGxsX19fNycsIHsgbiwgUiwgfVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy56ZXJvX3BhZF9sZW5ndGhcbiAgICAgIFIgPSBSLnBhZFN0YXJ0IEBjZmcuemVyb19wYWRfbGVuZ3RoLCBAY2ZnLmFscGhhYmV0LmF0IDBcbiAgICAgICMgZGVidWcgJ86paGxsX19fOCcsIHsgbiwgUiwgfVxuICAgIGVsc2VcbiAgICAgIFIgPSBSLnJlcGxhY2UgQGNmZy5ubGVhZF9yZSwgJydcbiAgICAgICMgZGVidWcgJ86paGxsX19fOScsIHsgbiwgUiwgfVxuICAgIHJldHVybiAoIEBjZmcubm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgcGFyc2U6ICggc29ydGtleSApIC0+XG4gICAgUiA9IFtdXG4gICAgZm9yIGxleGVtZSBpbiBAbGV4ZXIuc2Nhbl90b19saXN0IHNvcnRrZXlcbiAgICAgIHsgbmFtZSxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIHN0b3AsXG4gICAgICAgIGRhdGEsICAgICAgIH0gPSBsZXhlbWVcbiAgICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgeyBsZXR0ZXJzLFxuICAgICAgICBtYW50aXNzYSxcbiAgICAgICAgaW5kZXgsICAgICAgfSA9IGRhdGFcbiAgICAgIGxldHRlcnMgICAgICAgICA9IGxldHRlcnMuam9pbiAnJyBpZiAoIHR5cGVfb2YgbGV0dGVycyApIGlzICdsaXN0J1xuICAgICAgbWFudGlzc2EgICAgICAgPz0gbnVsbFxuICAgICAgaW5kZXggICAgICAgICAgPz0gbnVsbFxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBSLnB1c2ggeyBuYW1lLCBsZXR0ZXJzLCBtYW50aXNzYSwgaW5kZXgsIH1cbiAgICByZXR1cm4gUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlOiAoIHNvcnRrZXkgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgdW5sZXNzICggdHlwZSA9IHR5cGVfb2Ygc29ydGtleSApIGlzICd0ZXh0J1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzEwIGV4cGVjdGVkIGEgdGV4dCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIHNvcnRrZXkubGVuZ3RoID4gMFxuICAgICAgdGhyb3cgbmV3IEVycm9yIFwizqlobGxfXzExIGV4cGVjdGVkIGEgbm9uLWVtcHR5IHRleHQsIGdvdCAje3JwciBzb3J0a2V5fVwiXG4gICAgUiA9IFtdXG4gICAgZm9yIHVuaXQgaW4gQHBhcnNlIHNvcnRrZXlcbiAgICAgIGlmIHVuaXQubmFtZSBpcyAnb3RoZXInXG4gICAgICAgIG1lc3NhZ2UgICA9IFwizqlobGxfXzEyIG5vdCBhIHZhbGlkIHNvcnRrZXk6IHVuYWJsZSB0byBwYXJzZSAje3JwciB1bml0LmxldHRlcnN9XCJcbiAgICAgICAgbWVzc2FnZSAgKz0gXCIgaW4gI3tycHIgc29ydGtleX1cIiBpZiBzb3J0a2V5IGlzbnQgdW5pdC5sZXR0ZXJzXG4gICAgICAgIHRocm93IG5ldyBFcnJvciBtZXNzYWdlXG4gICAgICBSLnB1c2ggdW5pdC5pbmRleCBpZiB1bml0LmluZGV4P1xuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGVfaW50ZWdlcjogKCBuICkgLT5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5tb2R1bGUuZXhwb3J0cyA9IGRvID0+XG4gIGhvbGxlcml0aF8xMCAgICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBcbiAgaG9sbGVyaXRoXzEwbXZwICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cFxuICBob2xsZXJpdGhfMTBtdnAyICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwbXZwMlxuICBob2xsZXJpdGhfMTI4ICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOFxuICBob2xsZXJpdGhfMTI4YiAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOGJcbiAgcmV0dXJuIHtcbiAgICBIb2xsZXJpdGgsXG4gICAgaG9sbGVyaXRoXzEwLFxuICAgIGhvbGxlcml0aF8xMG12cCxcbiAgICBob2xsZXJpdGhfMTBtdnAyLFxuICAgIGhvbGxlcml0aF8xMjgsXG4gICAgaG9sbGVyaXRoXzEyOGIsXG4gICAgaW50ZXJuYWxzLCB9XG4iXX0=
