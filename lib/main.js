(function() {
  'use strict';
  var C, Hollerith, SFMODULES, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, debug, decode, encode, internals, regex, rpr, type_of;

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

  //-----------------------------------------------------------------------------------------------------------
  constants_128 = Object.freeze({
    max_integer: Number.MAX_SAFE_INTEGER,
    min_integer: Number.MIN_SAFE_INTEGER,
    zpuns: 'ãäåæçèéêëìíîïðñòóôõö÷', // zero and positive uniliteral numbers
    nuns: 'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ', // negative          uniliteral numbers
    zpun_max: +20,
    nun_min: -20,
    zero_pad_length: 8,
    alphabet: '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`' + 'abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ',
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
    // MLKJIHGFEDCBA
    // N XYZ
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
      this.cfg = _TMP_constants;
      this._compile_sorkey_re();
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    static _compile_sorkey_re() {
      // @cfg.sortkey_re =
      return null;
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
        throw new Error(`Ωhll___1 expected a float, got a ${type}`);
      }
      if (!((this.cfg.min_integer <= n && n <= this.cfg.max_integer))) {
        throw new Error(`Ωhll___2 expected a float between ${this.cfg.min_integer} and ${this.cfg.max_integer}, got ${n}`);
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
      // debug 'Ωhll___3', { n, R, }
      if (R.length < this.cfg.zero_pad_length) {
        R = R.padStart(this.cfg.zero_pad_length, this.cfg.alphabet.at(0));
      } else {
        // debug 'Ωhll___4', { n, R, }
        R = R.replace(this.cfg.nlead_re, '');
      }
      // debug 'Ωhll___5', { n, R, }
      return (this.cfg.nmag.at(R.length)) + R;
    }

    //---------------------------------------------------------------------------------------------------------
    decode(sortkey) {
      /* TAINT use proper validation */
      var type;
      if ((type = type_of(sortkey)) !== 'text') {
        throw new Error(`Ωhll___1 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll___1 expected a non-empty text, got ${rpr(sortkey)}`);
      }
    }

    //---------------------------------------------------------------------------------------------------------
    decode_integer(n) {}

  };

  //===========================================================================================================
  module.exports = (() => {
    var hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128;
    hollerith_10 = new Hollerith(constants_10);
    hollerith_10mvp = new Hollerith(constants_10mvp);
    hollerith_10mvp2 = new Hollerith(constants_10mvp2);
    hollerith_128 = new Hollerith(constants_128);
    return {Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, internals};
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxTQUFBLEVBQUEsU0FBQSxFQUFBLFNBQUEsRUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFNBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLE9BQUE7Ozs7O0VBS0EsU0FBQSxHQUE0QixPQUFBLENBQVEsK0JBQVI7O0VBQzVCLENBQUEsQ0FBRSxNQUFGLEVBQVUsTUFBVixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsT0FBRixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsZUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBO0lBQUUsY0FBQSxFQUFnQjtFQUFsQixDQUFBLEdBQTRCLFNBQVMsQ0FBQyxRQUFRLENBQUMsWUFBbkIsQ0FBQSxDQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQTVCOztFQUNBLENBQUEsQ0FBRSxLQUFGLENBQUEsR0FBNEIsT0FBQSxDQUFRLE9BQVIsQ0FBNUIsRUFWQTs7O0VBY0EsYUFBQSxHQUFnQixNQUFNLENBQUMsTUFBUCxDQUNkO0lBQUEsV0FBQSxFQUFjLE1BQU0sQ0FBQyxnQkFBckI7SUFDQSxXQUFBLEVBQWMsTUFBTSxDQUFDLGdCQURyQjtJQUVBLEtBQUEsRUFBYyx1QkFGZDtJQUdBLElBQUEsRUFBYyxzQkFIZDtJQUlBLFFBQUEsRUFBYyxDQUFDLEVBSmY7SUFLQSxPQUFBLEVBQWMsQ0FBQyxFQUxmO0lBTUEsZUFBQSxFQUFpQixDQU5qQjtJQU9BLFFBQUEsRUFBYywrREFBQSxHQUNJLHFFQVJsQjs7O0lBV0EsSUFBQSxFQUFjLFdBWGQ7SUFZQSxJ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TFcsQ0FBQTtBQXhKcEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbid1c2Ugc3RyaWN0J1xuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiMgeyBlbmNvZGVCaWdJbnQsXG4jICAgZGVjb2RlQmlnSW50LCAgIH0gPSBUTVBfcmVxdWlyZV9lbmNvZGVfaW5fYWxwaGFiZXQoKVxuU0ZNT0RVTEVTICAgICAgICAgICAgICAgICA9IHJlcXVpcmUgJ2JyaWNhYnJhYy1zaW5nbGUtZmlsZS1tb2R1bGVzJ1xueyBlbmNvZGUsIGRlY29kZSwgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX2FueWJhc2UoKVxueyB0eXBlX29mLCAgICAgICAgICAgICAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3R5cGVfb2YoKVxueyBzaG93X25vX2NvbG9yczogcnByLCAgfSA9IFNGTU9EVUxFUy51bnN0YWJsZS5yZXF1aXJlX3Nob3coKVxueyBkZWJ1ZywgICAgICAgICAgICAgICAgfSA9IGNvbnNvbGVcbnsgcmVnZXgsICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdyZWdleCdcblxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMjggPSBPYmplY3QuZnJlZXplXG4gIG1heF9pbnRlZ2VyOiAgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJcbiAgbWluX2ludGVnZXI6ICBOdW1iZXIuTUlOX1NBRkVfSU5URUdFUlxuICB6cHVuczogICAgICAgICfDo8Okw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnICMgemVybyBhbmQgcG9zaXRpdmUgdW5pbGl0ZXJhbCBudW1iZXJzXG4gIG51bnM6ICAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6InICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICsyMFxuICBudW5fbWluOiAgICAgIC0yMFxuICB6ZXJvX3BhZF9sZW5ndGg6IDhcbiAgYWxwaGFiZXQ6ICAgICAnISMkJSYoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj9AQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYCcgXFxcbiAgICAgICAgICAgICAgICAgICsgJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqXCpsKnwqjCqcKqwqvCrMKuwq/CsMKxwrLCs8K0wrXCtsK3wrjCucK6wrvCvMK9wr7Cv8OAw4HDgsODw4TDhcOGJ1xuICAjIyMgVEFJTlQgc2luY2Ugc21hbGwgaW50cyB1cCB0byArLy0yMCBhcmUgcmVwcmVzZW50ZWQgYnkgdW5pbGl0ZXJhbHMsIFBNQUcgYMO4YCBhbmQgTk1BRyBgw45gIHdpbGwgbmV2ZXJcbiAgYmUgdXNlZCwgdGh1cyBjYW4gYmUgZnJlZWQgZm9yIG90aGVyKD8pIHRoaW5ncyAjIyNcbiAgcG1hZzogICAgICAgICAnIMO4w7nDusO7w7zDvcO+w78nICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyDDjsONw4zDi8OKw4nDiMOHJyAgIyBuZWdhdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IG5lZ2F0aXZlIGRpZ2l0c1xuICBubGVhZF9yZTogICAgIC9eMsOGKi8gICAgICAjICduZWdhdGl2ZSBsZWFkZXInLCBkaXNjYXJkYWJsZSBsZWFkaW5nIGRpZ2l0cyBvZiBsaWZ0ZWQgbmVnYXRpdmUgbnVtYmVyc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMCA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICArOTk5XG4gIG1pbl9pbnRlZ2VyOiAgLTk5OVxuICB6cHVuczogICAgICAgICfDo8Okw6XDpicgIyB6ZXJvIGFuZCBwb3NpdGl2ZSB1bmlsaXRlcmFsIG51bWJlcnNcbiAgbnVuczogICAgICAgICAnw4/DkMORJyAgIyBuZWdhdGl2ZSAgICAgICAgICB1bmlsaXRlcmFsIG51bWJlcnNcbiAgenB1bl9tYXg6ICAgICArM1xuICBudW5fbWluOiAgICAgIC0zXG4gIHplcm9fcGFkX2xlbmd0aDogIDNcbiAgYWxwaGFiZXQ6ICAgICAnMDEyMzQ1Njc4OSdcbiAgcG1hZzogICAgICAgICAnIMO4w7nDusO7w7zDvcO+w78nICAgIyBwb3NpdGl2ZSAnbWFnbmlmaWVyJyBmb3IgMSB0byA4IHBvc2l0aXZlIGRpZ2l0c1xuICBubWFnOiAgICAgICAgICcgw47DjcOMw4vDisOJw4jDhycgICAjIG5lZ2F0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggbmVnYXRpdmUgZGlnaXRzXG4gIG5sZWFkX3JlOiAgICAgL145Kig/PVswLTldKS8gICAgICAgICAjICduZWdhdGl2ZSBsZWFkZXInLCBkaXNjYXJkYWJsZSBsZWFkaW5nIGRpZ2l0cyBvZiBsaWZ0ZWQgbmVnYXRpdmUgbnVtYmVyc1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNvbnN0YW50c18xMG12cCA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICArOTk5XG4gIG1pbl9pbnRlZ2VyOiAgLTk5OVxuICB6cHVuczogICAgICAgICdOJyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICcnICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICswXG4gIG51bl9taW46ICAgICAgLTBcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBwbWFnOiAgICAgICAgICcgT1BRUicgICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyBNTEtKJyAgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjkqKD89WzAtOV0pLyAgICAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEwbXZwMiA9IE9iamVjdC5mcmVlemVcbiAgbWF4X2ludGVnZXI6ICArOTk5XG4gIG1pbl9pbnRlZ2VyOiAgLTk5OVxuICAjIE1MS0pJSEdGRURDQkFcbiAgIyBOIFhZWlxuICB6cHVuczogICAgICAgICdOT1BRUlNUVVZXJyAjIHplcm8gYW5kIHBvc2l0aXZlIHVuaWxpdGVyYWwgbnVtYmVyc1xuICBudW5zOiAgICAgICAgICdFRkdISUpLTE0nICAjIG5lZ2F0aXZlICAgICAgICAgIHVuaWxpdGVyYWwgbnVtYmVyc1xuICB6cHVuX21heDogICAgICs5XG4gIG51bl9taW46ICAgICAgLTlcbiAgemVyb19wYWRfbGVuZ3RoOiAgM1xuICBhbHBoYWJldDogICAgICcwMTIzNDU2Nzg5J1xuICBwbWFnOiAgICAgICAgICcgIFhZWicgICAjIHBvc2l0aXZlICdtYWduaWZpZXInIGZvciAxIHRvIDggcG9zaXRpdmUgZGlnaXRzXG4gIG5tYWc6ICAgICAgICAgJyAgQ0JBJyAgICMgbmVnYXRpdmUgJ21hZ25pZmllcicgZm9yIDEgdG8gOCBuZWdhdGl2ZSBkaWdpdHNcbiAgbmxlYWRfcmU6ICAgICAvXjkqKD89WzAtOV0pLyAgICAgICAgICMgJ25lZ2F0aXZlIGxlYWRlcicsIGRpc2NhcmRhYmxlIGxlYWRpbmcgZGlnaXRzIG9mIGxpZnRlZCBuZWdhdGl2ZSBudW1iZXJzXG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBjb25zdGFudHMgPSBDID0gY29uc3RhbnRzXzEyOFxuY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMFxuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmludGVybmFscyA9IE9iamVjdC5mcmVlemUgeyBjb25zdGFudHMsIH1cblxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEhvbGxlcml0aFxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29uc3RydWN0b3I6ICggX1RNUF9jb25zdGFudHMgKSAtPlxuICAgIEBjZmcgPSBfVE1QX2NvbnN0YW50c1xuICAgIEBfY29tcGlsZV9zb3JrZXlfcmUoKVxuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEBfY29tcGlsZV9zb3JrZXlfcmU6IC0+XG5cbiAgICAjIEBjZmcuc29ydGtleV9yZSA9XG4gICAgcmV0dXJuIG51bGxcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZTogKCBpbnRlZ2VyX29yX2xpc3QgKSAtPlxuICAgICMjIyBUQUlOVCB1c2UgcHJvcGVyIHZhbGlkYXRpb24gIyMjXG4gICAgaWYgQXJyYXkuaXNBcnJheSBpbnRlZ2VyX29yX2xpc3RcbiAgICAgIHJldHVybiAoIEBlbmNvZGUgbiBmb3IgbiBpbiBpbnRlZ2VyX29yX2xpc3QgKS5qb2luICcnXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBuID0gaW50ZWdlcl9vcl9saXN0XG4gICAgdW5sZXNzIE51bWJlci5pc0Zpbml0ZSBuXG4gICAgICB0eXBlID0gJ1hYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFgnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzEgZXhwZWN0ZWQgYSBmbG9hdCwgZ290IGEgI3t0eXBlfVwiXG4gICAgdW5sZXNzIEBjZmcubWluX2ludGVnZXIgPD0gbiA8PSBAY2ZnLm1heF9pbnRlZ2VyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzIgZXhwZWN0ZWQgYSBmbG9hdCBiZXR3ZWVuICN7QGNmZy5taW5faW50ZWdlcn0gYW5kICN7QGNmZy5tYXhfaW50ZWdlcn0sIGdvdCAje259XCJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHJldHVybiBAZW5jb2RlX2ludGVnZXIgblxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX2ludGVnZXI6ICggbiApIC0+XG4gICAgIyMjIE5PVEUgY2FsbCBvbmx5IHdoZXJlIGFzc3VyZWQgYG5gIGlzIGludGVnZXIgd2l0aGluIG1hZ25pdHVkZSBvZiBgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVJgICMjI1xuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyBaZXJvIG9yIHNtYWxsIHBvc2l0aXZlOlxuICAgIHJldHVybiAoIEBjZmcuenB1bnMuYXQgbiApIGlmIDAgICAgICAgICAgPD0gbiA8PSBAY2ZnLnpwdW5fbWF4XG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIFNtYWxsIG5lZ2F0aXZlOlxuICAgIHJldHVybiAoIEBjZmcubnVucy5hdCAgbiApIGlmIEBjZmcubnVuX21pbiAgPD0gbiA8ICAwXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAjIEJpZyBwb3NpdGl2ZTpcbiAgICBpZiBuID4gQGNmZy56cHVuX21heFxuICAgICAgUiA9IGVuY29kZSBuLCBAY2ZnLmFscGhhYmV0XG4gICAgICByZXR1cm4gKCBAY2ZnLnBtYWcuYXQgUi5sZW5ndGggKSArIFJcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICMgQmlnIG5lZ2F0aXZlOlxuICAgICMjIyBOT1RFIHBsdXMgb25lIG9yIG5vdCBwbHVzIG9uZT8/ICMjI1xuICAgICMgUiA9ICggZW5jb2RlICggbiArIEBjZmcubWF4X2ludGVnZXIgKyAxICksIEBjZmcuYWxwaGFiZXQgKVxuICAgIFIgPSAoIGVuY29kZSAoIG4gKyBAY2ZnLm1heF9pbnRlZ2VyICAgICApLCBAY2ZnLmFscGhhYmV0IClcbiAgICAjIGRlYnVnICfOqWhsbF9fXzMnLCB7IG4sIFIsIH1cbiAgICBpZiBSLmxlbmd0aCA8IEBjZmcuemVyb19wYWRfbGVuZ3RoXG4gICAgICBSID0gUi5wYWRTdGFydCBAY2ZnLnplcm9fcGFkX2xlbmd0aCwgQGNmZy5hbHBoYWJldC5hdCAwXG4gICAgICAjIGRlYnVnICfOqWhsbF9fXzQnLCB7IG4sIFIsIH1cbiAgICBlbHNlXG4gICAgICBSID0gUi5yZXBsYWNlIEBjZmcubmxlYWRfcmUsICcnXG4gICAgICAjIGRlYnVnICfOqWhsbF9fXzUnLCB7IG4sIFIsIH1cbiAgICByZXR1cm4gKCBAY2ZnLm5tYWcuYXQgUi5sZW5ndGggKSArIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZTogKCBzb3J0a2V5ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIHVubGVzcyAoIHR5cGUgPSB0eXBlX29mIHNvcnRrZXkgKSBpcyAndGV4dCdcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMSBleHBlY3RlZCBhIHRleHQsIGdvdCBhICN7dHlwZX1cIlxuICAgIHVubGVzcyBzb3J0a2V5Lmxlbmd0aCA+IDBcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMSBleHBlY3RlZCBhIG5vbi1lbXB0eSB0ZXh0LCBnb3QgI3tycHIgc29ydGtleX1cIlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZGVjb2RlX2ludGVnZXI6ICggbiApIC0+XG5cbiM9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxubW9kdWxlLmV4cG9ydHMgPSBkbyA9PlxuICBob2xsZXJpdGhfMTAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwXG4gIGhvbGxlcml0aF8xMG12cCAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnBcbiAgaG9sbGVyaXRoXzEwbXZwMiAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cDJcbiAgaG9sbGVyaXRoXzEyOCAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhcbiAgcmV0dXJuIHsgSG9sbGVyaXRoLCBob2xsZXJpdGhfMTAsIGhvbGxlcml0aF8xMG12cCwgaG9sbGVyaXRoXzEwbXZwMiwgaG9sbGVyaXRoXzEyOCwgaW50ZXJuYWxzLCB9XG4iXX0=
