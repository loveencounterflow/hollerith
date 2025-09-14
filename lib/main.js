(function() {
  'use strict';
  var C, CFG, Grammar, Hollerith, Hollerith_typespace, Lexeme, SFMODULES, Token, clean_assign, constants, constants_10, constants_10mvp, constants_10mvp2, constants_128, constants_128_16383, debug, decode, encode, freeze, get_max_integer, get_required_digits, hide, internals, log_to_base, regex, rpr, set_getter, type_of, types;

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

  ({hide, set_getter} = SFMODULES.require_managed_property_tools());

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
      var R, hollerith_cfg_template, ref;
      hollerith_cfg_template = {
        blank: '\x20',
        dimension: 5
      };
      R = clean_assign({}, hollerith_cfg_template, cfg);
      types = new Hollerith_typespace({
        blank: R.blank
      });
      R.digitset = types.digitset.validate(R.digitset);
      R._digits_list = types.digitset.data._digits_list;
      R._naught = types.digitset.data._naught;
      R._nova = types.digitset.data._nova;
      R._leading_novas_re = types.digitset.data._leading_novas_re;
      R._base = types.digitset.data._base;
      R.magnifiers = types.magnifiers.validate(R.magnifiers);
      R._pmag_list = types.magnifiers.data._pmag_list;
      R._nmag_list = types.magnifiers.data._nmag_list;
      R.uniliterals = types.uniliterals.validate(R.uniliterals);
      R._cipher = types.uniliterals.data._cipher;
      R._nuns = types.uniliterals.data._nuns;
      R._zpuns = types.uniliterals.data._zpuns;
      R._nuns_list = types.uniliterals.data._nuns_list;
      R._zpuns_list = types.uniliterals.data._zpuns_list;
      if (R._cipher !== R._zpuns_list[0]) {
        throw new Error(`Ωhll___1 internal error: _cipher ${rpr(R._cipher)} doesn't match _zpuns ${rpr(R._zpuns)}`);
      }
      R._min_nun = -R._nuns_list.length;
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
      if (R._nmag_list.length < R.digits_per_idx) {
        throw new Error(`Ωhll___2 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._nmag_list.length} positive magnifiers`);
      } else if (R._nmag_list.length > R.digits_per_idx) {
        R._nmag_list = freeze(R._nmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      if (R._pmag_list.length < R.digits_per_idx) {
        throw new Error(`Ωhll___3 digits_per_idx is ${R.digits_per_idx}, but there are only ${R._pmag_list.length} positive magnifiers`);
      } else if (R._pmag_list.length > R.digits_per_idx) {
        R._pmag_list = freeze(R._pmag_list.slice(0, +R.digits_per_idx + 1 || 9e9));
      }
      //.......................................................................................................
      R._pmag = R._pmag_list.join('');
      R._nmag = R._nmag_list.join('');
      R._max_idx_width = R.digits_per_idx + 1;
      R._sortkey_width = R._max_idx_width * R.dimension;
      //.......................................................................................................
      R._min_integer = -R._max_integer;
      //.......................................................................................................
      /* TAINT this can be greatly simplified with To Dos implemented */
      R._alphabet = types._alphabet.validate((R.digitset + ([...R._nmag_list].reverse().join('')) + R._nuns + R._zpuns + R._pmag).replace(types[CFG].blank_splitter, ''));
      return {
        cfg: R,
        types
      };
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
        mantissa = d.mantissa.padStart(cfg.digits_per_idx, max_digit);
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
        throw new Error(`Ωhll___5 expected a text, got a ${type}`);
      }
      if (!(sortkey.length > 0)) {
        throw new Error(`Ωhll___6 expected a non-empty text, got ${rpr(sortkey)}`);
      }
      R = [];
      ref = this.parse(sortkey);
      for (i = 0, len = ref.length; i < len; i++) {
        unit = ref[i];
        if (unit.name === 'other') {
          message = `Ωhll___7 not a valid sortkey: unable to parse ${rpr(unit.letters)}`;
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
      throw new Error("Ωhll___8 not implemented");
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0VBQUE7QUFBQSxNQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQSxtQkFBQSxFQUFBLE1BQUEsRUFBQSxTQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsWUFBQSxFQUFBLGVBQUEsRUFBQSxnQkFBQSxFQUFBLGFBQUEsRUFBQSxtQkFBQSxFQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUEsbUJBQUEsRUFBQSxJQUFBLEVBQUEsU0FBQSxFQUFBLFdBQUEsRUFBQSxLQUFBLEVBQUEsR0FBQSxFQUFBLFVBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTs7Ozs7RUFLQSxTQUFBLEdBQTRCLE9BQUEsQ0FBUSwrQkFBUjs7RUFDNUIsQ0FBQSxDQUFFLE9BQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLGVBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQTtJQUFFLGNBQUEsRUFBZ0I7RUFBbEIsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLFlBQW5CLENBQUEsQ0FBNUI7O0VBQ0EsQ0FBQSxDQUFFLEtBQUYsQ0FBQSxHQUE0QixPQUE1Qjs7RUFDQSxDQUFBLENBQUUsS0FBRixDQUFBLEdBQTRCLE9BQUEsQ0FBUSxPQUFSLENBQTVCOztFQUNBLENBQUEsQ0FBRSxPQUFGLEVBQ0UsS0FERixFQUVFLE1BRkYsQ0FBQSxHQUU0QixPQUFBLENBQVEsVUFBUixDQUY1Qjs7RUFHQSxLQUFBLEdBQTRCLE9BQUEsQ0FBUSxTQUFSOztFQUM1QixDQUFBLENBQUUsR0FBRixFQUNFLG1CQURGLENBQUEsR0FDNEIsS0FENUI7O0VBRUEsQ0FBQSxDQUFFLFlBQUYsQ0FBQSxHQUE0QixTQUFTLENBQUMsUUFBUSxDQUFDLG9CQUFuQixDQUFB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QUFQLEdBQW9CLENBQUEsQ0FBQSxDQUFBLEdBQUE7QUFDcEIsUUFBQSxZQUFBLEVBQUEsZUFBQSxFQUFBLGdCQUFBLEVBQUEsYUFBQSxFQUFBO0lBQUUsWUFBQSxHQUFzQixJQUFJLFNBQUosQ0FBYyxZQUFkO0lBQ3RCLGVBQUEsR0FBc0IsSUFBSSxTQUFKLENBQWMsZUFBZDtJQUN0QixnQkFBQSxHQUFzQixJQUFJLFNBQUosQ0FBYyxnQkFBZDtJQUN0QixhQUFBLEdBQXNCLElBQUksU0FBSixDQUFjLGFBQWQ7SUFDdEIsbUJBQUEsR0FBc0IsSUFBSSxTQUFKLENBQWMsbUJBQWQ7QUFDdEIsV0FBTyxDQUNMLFNBREssRUFFTCxZQUZLLEVBR0wsZUFISyxFQUlMLGdCQUpLLEVBS0wsYUFMSyxFQU1MLG1CQU5LLEVBT0wsU0FQSztFQU5XLENBQUE7QUF4UnBCIiwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHN0cmljdCdcblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jIHsgZW5jb2RlQmlnSW50LFxuIyAgIGRlY29kZUJpZ0ludCwgICB9ID0gVE1QX3JlcXVpcmVfZW5jb2RlX2luX2FscGhhYmV0KClcblNGTU9EVUxFUyAgICAgICAgICAgICAgICAgPSByZXF1aXJlICdicmljYWJyYWMtc2luZ2xlLWZpbGUtbW9kdWxlcydcbnsgdHlwZV9vZiwgICAgICAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV90eXBlX29mKClcbnsgc2hvd19ub19jb2xvcnM6IHJwciwgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9zaG93KClcbnsgZGVidWcsICAgICAgICAgICAgICAgIH0gPSBjb25zb2xlXG57IHJlZ2V4LCAgICAgICAgICAgICAgICB9ID0gcmVxdWlyZSAncmVnZXgnXG57IEdyYW1tYXJcbiAgVG9rZW5cbiAgTGV4ZW1lICAgICAgICAgICAgICAgIH0gPSByZXF1aXJlICdpbnRlcmxleCdcbnR5cGVzICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlICcuL3R5cGVzJ1xueyBDRkcsXG4gIEhvbGxlcml0aF90eXBlc3BhY2UsICB9ID0gdHlwZXNcbnsgY2xlYW5fYXNzaWduLCAgICAgICAgIH0gPSBTRk1PRFVMRVMudW5zdGFibGUucmVxdWlyZV9jbGVhbl9hc3NpZ24oKVxueyBlbmNvZGUsXG4gIGRlY29kZSxcbiAgbG9nX3RvX2Jhc2UsXG4gIGdldF9yZXF1aXJlZF9kaWdpdHMsXG4gIGdldF9tYXhfaW50ZWdlciwgICAgICB9ID0gU0ZNT0RVTEVTLnVuc3RhYmxlLnJlcXVpcmVfYW55YmFzZSgpXG57IGZyZWV6ZSwgICAgICAgICAgICAgICB9ID0gT2JqZWN0XG57IGhpZGUsXG4gIHNldF9nZXR0ZXIsICAgICAgICAgICB9ID0gU0ZNT0RVTEVTLnJlcXVpcmVfbWFuYWdlZF9wcm9wZXJ0eV90b29scygpXG5cblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTI4ID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ8OPw5DDkcOSw5PDlMOVw5bDl8OYw5nDmsObw5zDncOew5/DoMOhw6Igw6Mgw6TDpcOmw6fDqMOpw6rDq8Osw63DrsOvw7DDscOyw7PDtMO1w7bDtydcbiAgIyMjICAgICAgICAgICAgICAgICAgICAgICAgICAgMSAgICAgICAgIDIgICAgICAgICAzICAgICAgICMjI1xuICAjIyMgICAgICAgICAgICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMiAgICAgIyMjXG4gIGRpZ2l0c2V0OiAgICAgICAgICAgJyEjJCUmKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ0NERUZHSElKS0xNTk9QUVJTVFVWV1hZWltdXl9gYWJjJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fsKhwqLCo8KkwqUnICsgXFxcbiAgICAgICAgICAgICAgICAgICAgICAnwqbCp8KowqnCqsKrwqzCrsKvwrDCscKywrPCtMK1wrbCt8K4wrnCusK7wrzCvcK+wr/DgMOBw4LDg8OEw4XDhidcbiAgIyMjIFRBSU5UIHNpbmNlIHNtYWxsIGludHMgdXAgdG8gKy8tMjAgYXJlIHJlcHJlc2VudGVkIGJ5IHVuaWxpdGVyYWxzLCBQTUFHIGDDuGAgYW5kIE5NQUcgYMOOYCB3aWxsIG5ldmVyXG4gIGJlIHVzZWQsIHRodXMgY2FuIGJlIGZyZWVkIGZvciBvdGhlcig/KSB0aGluZ3MgIyMjXG4gIG1hZ25pZmllcnM6ICAgICAgICAgJ8OHw4jDicOKw4vDjMONw44gw7jDucO6w7vDvMO9w77DvydcbiAgZGltZW5zaW9uOiAgICAgICAgICA1XG5cbiMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY29uc3RhbnRzXzEyOF8xNjM4MyA9IGZyZWV6ZVxuICB1bmlsaXRlcmFsczogICAgICAgICfDj8OQw5HDksOTw5TDlcOWw5fDmMOZw5rDm8Ocw53DnsOfw6DDocOiIMOjIMOkw6XDpsOnw6jDqcOqw6vDrMOtw67Dr8Oww7HDssOzw7TDtcO2w7cnXG4gICMjIyAgICAgICAgICAgICAgICAgICAgICAgICAgIDEgICAgICAgICAyICAgICAgICAgMyAgICAgICAjIyNcbiAgIyMjICAgICAgICAgICAgICAgICAgMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIgICAgICMjI1xuICBkaWdpdHNldDogICAgICAgICAgICchIyQlJigpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQicgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdDREVGR0hJSktMTU5PUFFSU1RVVldYWVpbXV5fYGFiYycgKyBcXFxuICAgICAgICAgICAgICAgICAgICAgICdkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX7CocKiwqPCpMKlJyArIFxcXG4gICAgICAgICAgICAgICAgICAgICAgJ8KmwqfCqMKpwqrCq8Kswq7Cr8KwwrHCssKzwrTCtcK2wrfCuMK5wrrCu8K8wr3CvsK/w4DDgcOCw4PDhMOFw4YnXG4gICMjIyBUQUlOVCBzaW5jZSBzbWFsbCBpbnRzIHVwIHRvICsvLTIwIGFyZSByZXByZXNlbnRlZCBieSB1bmlsaXRlcmFscywgUE1BRyBgw7hgIGFuZCBOTUFHIGDDjmAgd2lsbCBuZXZlclxuICBiZSB1c2VkLCB0aHVzIGNhbiBiZSBmcmVlZCBmb3Igb3RoZXIoPykgdGhpbmdzICMjI1xuICBtYWduaWZpZXJzOiAgICAgICAgICfDh8OIw4nDisOLw4zDjcOOIMO4w7nDusO7w7zDvcO+w78nXG4gIGRpbWVuc2lvbjogICAgICAgICAgNVxuICBkaWdpdHNfcGVyX2lkeDogICAgIDJcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTAgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnw4/DkMORIMOjIMOkw6XDpidcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnw4fDiMOJw4rDi8OMw43DjiDDuMO5w7rDu8O8w73DvsO/J1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAgPSBmcmVlemVcbiAgdW5pbGl0ZXJhbHM6ICAgICAgICAnTidcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnSktMTSBPUFFSJ1xuICBkaW1lbnNpb246ICAgICAgICAgIDVcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jb25zdGFudHNfMTBtdnAyID0gZnJlZXplXG4gIHVuaWxpdGVyYWxzOiAgICAgICAgJ0VGR0hJSktMTSBOIE9QUVJTVFVWVydcbiAgZGlnaXRzZXQ6ICAgICAgICAgICAnMDEyMzQ1Njc4OSdcbiAgbWFnbmlmaWVyczogICAgICAgICAnQUJDIFhZWidcbiAgZGltZW5zaW9uOiAgICAgICAgICAzXG4gIGRpZ2l0c19wZXJfaWR4OiAgICAgM1xuXG4jLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgY29uc3RhbnRzID0gQyA9IGNvbnN0YW50c18xMjhcbmNvbnN0YW50cyA9IEMgPSBjb25zdGFudHNfMTBcblxuIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5pbnRlcm5hbHMgPSBmcmVlemUgeyBjb25zdGFudHMsIHR5cGVzLCB9XG5cblxuIz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBIb2xsZXJpdGhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbnN0cnVjdG9yOiAoIGNmZyApIC0+XG4gICAgY2xhc3ogICAgICAgICAgID0gQGNvbnN0cnVjdG9yXG4gICAgeyBjZmcsXG4gICAgICB0eXBlcywgICAgICB9ID0gY2xhc3oudmFsaWRhdGVfYW5kX2NvbXBpbGVfY2ZnIGNmZ1xuICAgIEBjZmcgICAgICAgICAgICA9IGZyZWV6ZSBjZmdcbiAgICBAbGV4ZXIgICAgICAgICAgPSBAY29tcGlsZV9zb3J0a2V5X2xleGVyIEBjZmdcbiAgICBoaWRlIEAsICd0eXBlcycsICB0eXBlc1xuICAgIHJldHVybiB1bmRlZmluZWRcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIEB2YWxpZGF0ZV9hbmRfY29tcGlsZV9jZmc6ICggY2ZnICkgLT5cbiAgICAjIyMgVmFsaWRhdGlvbnM6ICMjI1xuICAgICMjIyBEZXJpdmF0aW9uczogIyMjXG4gICAgaG9sbGVyaXRoX2NmZ190ZW1wbGF0ZSA9XG4gICAgICBibGFuazogICAgICAgICdcXHgyMCdcbiAgICAgIGRpbWVuc2lvbjogICA1XG4gICAgUiAgICAgICAgICAgICAgICAgICAgID0gY2xlYW5fYXNzaWduIHt9LCBob2xsZXJpdGhfY2ZnX3RlbXBsYXRlLCBjZmdcbiAgICB0eXBlcyAgICAgICAgICAgICAgICAgPSBuZXcgSG9sbGVyaXRoX3R5cGVzcGFjZSB7IGJsYW5rOiBSLmJsYW5rLCB9XG4gICAgUi5kaWdpdHNldCAgICAgICAgICAgID0gdHlwZXMuZGlnaXRzZXQudmFsaWRhdGUgUi5kaWdpdHNldFxuICAgIFIuX2RpZ2l0c19saXN0ICAgICAgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX2RpZ2l0c19saXN0XG4gICAgUi5fbmF1Z2h0ICAgICAgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fbmF1Z2h0XG4gICAgUi5fbm92YSAgICAgICAgICAgICAgID0gdHlwZXMuZGlnaXRzZXQuZGF0YS5fbm92YVxuICAgIFIuX2xlYWRpbmdfbm92YXNfcmUgICA9IHR5cGVzLmRpZ2l0c2V0LmRhdGEuX2xlYWRpbmdfbm92YXNfcmVcbiAgICBSLl9iYXNlICAgICAgICAgICAgICAgPSB0eXBlcy5kaWdpdHNldC5kYXRhLl9iYXNlXG4gICAgUi5tYWduaWZpZXJzICAgICAgICAgID0gdHlwZXMubWFnbmlmaWVycy52YWxpZGF0ZSBSLm1hZ25pZmllcnNcbiAgICBSLl9wbWFnX2xpc3QgICAgICAgICAgPSB0eXBlcy5tYWduaWZpZXJzLmRhdGEuX3BtYWdfbGlzdFxuICAgIFIuX25tYWdfbGlzdCAgICAgICAgICA9IHR5cGVzLm1hZ25pZmllcnMuZGF0YS5fbm1hZ19saXN0XG4gICAgUi51bmlsaXRlcmFscyAgICAgICAgID0gdHlwZXMudW5pbGl0ZXJhbHMudmFsaWRhdGUgUi51bmlsaXRlcmFsc1xuICAgIFIuX2NpcGhlciAgICAgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX2NpcGhlclxuICAgIFIuX251bnMgICAgICAgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX251bnNcbiAgICBSLl96cHVucyAgICAgICAgICAgICAgPSB0eXBlcy51bmlsaXRlcmFscy5kYXRhLl96cHVuc1xuICAgIFIuX251bnNfbGlzdCAgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX251bnNfbGlzdFxuICAgIFIuX3pwdW5zX2xpc3QgICAgICAgICA9IHR5cGVzLnVuaWxpdGVyYWxzLmRhdGEuX3pwdW5zX2xpc3RcbiAgICBpZiBSLl9jaXBoZXIgaXNudCBSLl96cHVuc19saXN0WyAwIF1cbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMSBpbnRlcm5hbCBlcnJvcjogX2NpcGhlciAje3JwciBSLl9jaXBoZXJ9IGRvZXNuJ3QgbWF0Y2ggX3pwdW5zICN7cnByIFIuX3pwdW5zfVwiXG4gICAgUi5fbWluX251biAgICAgICAgICAgID0gLVIuX251bnNfbGlzdC5sZW5ndGhcbiAgICBSLl9tYXhfenB1biAgICAgICAgICAgPSBSLl96cHVuc19saXN0Lmxlbmd0aCAtIDFcbiAgICBSLmRpbWVuc2lvbiAgICAgICAgICAgPSB0eXBlcy5kaW1lbnNpb24udmFsaWRhdGUgUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuZGlnaXRzX3Blcl9pZHggICAgID89IE1hdGgubWluICggUi5fcG1hZ19saXN0Lmxlbmd0aCAtIDEgKSwgKCBSLmRpZ2l0c19wZXJfaWR4ID8gSW5maW5pdHkgKVxuICAgIFIuZGlnaXRzX3Blcl9pZHggICAgICA9IHR5cGVzLmRpZ2l0c19wZXJfaWR4LnZhbGlkYXRlIFIuZGlnaXRzX3Blcl9pZHgsIFIuX3BtYWdfbGlzdFxuICAgIFIuX21heF9pbnRlZ2VyICAgICAgICA9IHR5cGVzLmNyZWF0ZV9tYXhfaW50ZWdlciB7IF9iYXNlOiBSLl9iYXNlLCBkaWdpdHNfcGVyX2lkeDogUi5kaWdpdHNfcGVyX2lkeCwgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgUi5fbm1hZ19saXN0Lmxlbmd0aCA8IFIuZGlnaXRzX3Blcl9pZHhcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fMiBkaWdpdHNfcGVyX2lkeCBpcyAje1IuZGlnaXRzX3Blcl9pZHh9LCBidXQgdGhlcmUgYXJlIG9ubHkgI3tSLl9ubWFnX2xpc3QubGVuZ3RofSBwb3NpdGl2ZSBtYWduaWZpZXJzXCJcbiAgICBlbHNlIGlmIFIuX25tYWdfbGlzdC5sZW5ndGggPiBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICBSLl9ubWFnX2xpc3QgPSBmcmVlemUgUi5fbm1hZ19saXN0WyAuLiBSLmRpZ2l0c19wZXJfaWR4IF1cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIFIuX3BtYWdfbGlzdC5sZW5ndGggPCBSLmRpZ2l0c19wZXJfaWR4XG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzMgZGlnaXRzX3Blcl9pZHggaXMgI3tSLmRpZ2l0c19wZXJfaWR4fSwgYnV0IHRoZXJlIGFyZSBvbmx5ICN7Ui5fcG1hZ19saXN0Lmxlbmd0aH0gcG9zaXRpdmUgbWFnbmlmaWVyc1wiXG4gICAgZWxzZSBpZiBSLl9wbWFnX2xpc3QubGVuZ3RoID4gUi5kaWdpdHNfcGVyX2lkeFxuICAgICAgUi5fcG1hZ19saXN0ID0gZnJlZXplIFIuX3BtYWdfbGlzdFsgLi4gUi5kaWdpdHNfcGVyX2lkeCBdXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSLl9wbWFnICAgICAgICAgICAgICAgPSBSLl9wbWFnX2xpc3Quam9pbiAnJ1xuICAgIFIuX25tYWcgICAgICAgICAgICAgICA9IFIuX25tYWdfbGlzdC5qb2luICcnXG4gICAgUi5fbWF4X2lkeF93aWR0aCAgICAgID0gUi5kaWdpdHNfcGVyX2lkeCArIDFcbiAgICBSLl9zb3J0a2V5X3dpZHRoICAgICAgPSBSLl9tYXhfaWR4X3dpZHRoICogUi5kaW1lbnNpb25cbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIuX21pbl9pbnRlZ2VyICAgICAgICA9IC1SLl9tYXhfaW50ZWdlclxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgIyMjIFRBSU5UIHRoaXMgY2FuIGJlIGdyZWF0bHkgc2ltcGxpZmllZCB3aXRoIFRvIERvcyBpbXBsZW1lbnRlZCAjIyNcbiAgICBSLl9hbHBoYWJldCAgICAgICAgICAgPSB0eXBlcy5fYWxwaGFiZXQudmFsaWRhdGUgKCBSLmRpZ2l0c2V0ICsgKCBcXFxuICAgICAgWyBSLl9ubWFnX2xpc3QuLi4sIF0ucmV2ZXJzZSgpLmpvaW4gJycgKSArIFxcXG4gICAgICBSLl9udW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICsgXFxcbiAgICAgIFIuX3pwdW5zICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBcXFxuICAgICAgUi5fcG1hZyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkucmVwbGFjZSB0eXBlc1tDRkddLmJsYW5rX3NwbGl0dGVyLCAnJ1xuICAgIHJldHVybiB7IGNmZzogUiwgdHlwZXMsIH1cblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGNvbXBpbGVfc29ydGtleV9sZXhlcjogKCBjZmcgKSAtPlxuICAgIHsgX251bnMsXG4gICAgICBfenB1bnMsXG4gICAgICBfbm1hZyxcbiAgICAgIF9wbWFnLFxuICAgICAgZGlnaXRzZXQsICAgICB9ID0gY2ZnXG4gICAgIyBfYmFzZSAgICAgICAgICAgICAgPSBkaWdpdHNldC5sZW5ndGhcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIG51bnNfbGV0dGVycyAgPSBfbnVuc1xuICAgIHB1bnNfbGV0dGVycyAgPSBfenB1bnNbICAxIC4uICBdXG4gICAgbm1hZ19sZXR0ZXJzICA9IF9ubWFnWyAgIDEgLi4gIF1cbiAgICBwbWFnX2xldHRlcnMgID0gX3BtYWdbICAgMSAuLiAgXVxuICAgIHplcm9fbGV0dGVycyAgPSBfenB1bnNbICAwICAgICBdXG4gICAgbWF4X2RpZ2l0ICAgICA9IGRpZ2l0c2V0LmF0IC0xXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBmaXRfbnVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tudW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfcHVuICAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twdW5zX2xldHRlcnN9IF0gICkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfbm51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3tubWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcG51bSAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3twbWFnX2xldHRlcnN9IF0gICkgKD88bWFudGlzc2E+IFsgI3tkaWdpdHNldH0gIF0qICkgXCJcbiAgICBmaXRfcGFkZGluZyAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0rICkgJCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcbiAgICBmaXRfemVybyAgICAgID0gcmVnZXhcIig/PGxldHRlcnM+IFsgI3t6ZXJvX2xldHRlcnN9IF0gICg/PSAuKiBbXiAje3plcm9fbGV0dGVyc30gXSApICkgICAgIFwiXG4gICAgZml0X290aGVyICAgICA9IHJlZ2V4XCIoPzxsZXR0ZXJzPiAuICAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiXG4gICAgYWxsX3plcm9fcmUgICA9IHJlZ2V4XCJeICN7emVyb19sZXR0ZXJzfSsgJFwiXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBjYXN0X251biAgICAgID0gKHsgZGF0YTogZCwgfSkgLT4gZC5pbmRleCA9ICggY2ZnLl9udW5zLmluZGV4T2YgZC5sZXR0ZXJzICkgLSBjZmcuX251bnMubGVuZ3RoXG4gICAgY2FzdF9wdW4gICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSArY2ZnLl96cHVucy5pbmRleE9mICBkLmxldHRlcnNcbiAgICBjYXN0X25udW0gICAgID0gKHsgZGF0YTogZCwgfSkgLT5cbiAgICAgIG1hbnRpc3NhICA9IGQubWFudGlzc2EucGFkU3RhcnQgY2ZnLmRpZ2l0c19wZXJfaWR4LCBtYXhfZGlnaXRcbiAgICAgIGQuaW5kZXggICA9ICggZGVjb2RlIG1hbnRpc3NhLCBkaWdpdHNldCApIC0gY2ZnLl9tYXhfaW50ZWdlclxuICAgIGNhc3RfcG51bSAgICAgPSAoeyBkYXRhOiBkLCB9KSAtPiBkLmluZGV4ID0gZGVjb2RlIGQubWFudGlzc2EsIGRpZ2l0c2V0XG4gICAgY2FzdF96ZXJvICAgICA9ICh7IGRhdGE6IGQsIH0pIC0+IGQuaW5kZXggPSAwXG4gICAgY2FzdF9wYWRkaW5nICA9ICh7IGRhdGE6IGQsIHNvdXJjZSwgaGl0LCB9KSAtPiBkLmluZGV4ID0gMCBpZiBzb3VyY2UgaXMgaGl0XG4gICAgY2FzdF9vdGhlciAgICA9IG51bGxcbiAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIFIgICAgICAgICAgICAgPSBuZXcgR3JhbW1hciB7IGVtaXRfc2lnbmFsczogZmFsc2UsIH1cbiAgICBmaXJzdCAgICAgICAgID0gUi5uZXdfbGV2ZWwgeyBuYW1lOiAnZmlyc3QnLCB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnbnVuJywgICAgICBmaXQ6IGZpdF9udW4sICAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9udW4sICAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3B1bicsICAgICAgZml0OiBmaXRfcHVuLCAgICAgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcHVuLCAgICAgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICdubnVtJywgICAgIGZpdDogZml0X25udW0sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X25udW0sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAncG51bScsICAgICBmaXQ6IGZpdF9wbnVtLCAgICAgICAgICAgICAgICAgY2FzdDogY2FzdF9wbnVtLCAgICAgfVxuICAgIGZpcnN0Lm5ld190b2tlbiAgIHsgbmFtZTogJ3BhZGRpbmcnLCAgZml0OiBmaXRfcGFkZGluZywgICAgICAgICAgICAgIGNhc3Q6IGNhc3RfcGFkZGluZywgIH1cbiAgICBmaXJzdC5uZXdfdG9rZW4gICB7IG5hbWU6ICd6ZXJvJywgICAgIGZpdDogZml0X3plcm8sICAgICAgICAgICAgICAgICBjYXN0OiBjYXN0X3plcm8sICAgICB9XG4gICAgZmlyc3QubmV3X3Rva2VuICAgeyBuYW1lOiAnb3RoZXInLCAgICBmaXQ6IGZpdF9vdGhlciwgbWVyZ2U6ICdsaXN0JywgY2FzdDogY2FzdF9vdGhlciwgICAgfVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZTogKCBpZHhfb3JfdmR4ICkgLT5cbiAgICAjIyMgVEFJTlQgdXNlIHByb3BlciB2YWxpZGF0aW9uICMjI1xuICAgIEB0eXBlcy5pZHhfb3JfdmR4LnZhbGlkYXRlIGlkeF9vcl92ZHhcbiAgICBzd2l0Y2ggdHlwZSA9IEB0eXBlcy5pZHhfb3JfdmR4LmRhdGEudHlwZVxuICAgICAgd2hlbiAnaWR4JyB0aGVuIHJldHVybiBAZW5jb2RlX2lkeCAgaWR4X29yX3ZkeFxuICAgICAgd2hlbiAndmR4JyB0aGVuIHJldHVybiBAX2VuY29kZV92ZHggaWR4X29yX3ZkeFxuICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fNCBpbnRlcm5hbCBlcnJvcjogdW5rbm93biB0eXBlICN7cnByIHR5cGV9XCJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGVuY29kZV9pZHg6ICggaWR4ICkgLT4gQF9lbmNvZGVfaWR4IEB0eXBlcy5pZHgudmFsaWRhdGUgaWR4LCBAY2ZnLl9taW5faW50ZWdlciwgQGNmZy5fbWF4X2ludGVnZXJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9lbmNvZGVfaWR4OiAoIGlkeCApIC0+XG4gICAgIyMjIE5PVEUgY2FsbCBvbmx5IHdoZXJlIGFzc3VyZWQgYGlkeGAgaXMgaW50ZWdlciB3aXRoaW4gbWFnbml0dWRlIG9mIGBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUmAgIyMjXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gKCBAY2ZnLl96cHVucy5hdCBpZHggKSBpZiAwICAgICAgICAgICAgICA8PSBpZHggPD0gQGNmZy5fbWF4X3pwdW4gICMgWmVybyBvciBzbWFsbCBwb3NpdGl2ZVxuICAgIHJldHVybiAoIEBjZmcuX251bnMuYXQgIGlkeCApIGlmIEBjZmcuX21pbl9udW4gIDw9IGlkeCA8ICAwICAgICAgICAgICAgICAgIyBTbWFsbCBuZWdhdGl2ZVxuICAgICMuLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgaWR4ID4gQGNmZy5fbWF4X3pwdW4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIyBCaWcgcG9zaXRpdmVcbiAgICAgIFIgPSBlbmNvZGUgaWR4LCBAY2ZnLmRpZ2l0c2V0XG4gICAgICByZXR1cm4gKCBAY2ZnLl9wbWFnLmF0IFIubGVuZ3RoICkgKyBSXG4gICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBSID0gKCBlbmNvZGUgKCBpZHggKyBAY2ZnLl9tYXhfaW50ZWdlciAgICAgKSwgQGNmZy5kaWdpdHNldCApICAgICAgICAgICAjIEJpZyBuZWdhdGl2ZVxuICAgIGlmIFIubGVuZ3RoIDwgQGNmZy5kaWdpdHNfcGVyX2lkeCB0aGVuIFIgPSBSLnBhZFN0YXJ0IEBjZmcuZGlnaXRzX3Blcl9pZHgsIEBjZmcuZGlnaXRzZXQuYXQgMFxuICAgIGVsc2UgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSID0gUi5yZXBsYWNlIEBjZmcuX2xlYWRpbmdfbm92YXNfcmUsICcnXG4gICAgcmV0dXJuICggQGNmZy5fbm1hZy5hdCBSLmxlbmd0aCApICsgUlxuXG4gICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgZW5jb2RlX3ZkeDogKCB2ZHggKSAtPiBAX2VuY29kZV92ZHggQHR5cGVzLnZkeC52YWxpZGF0ZSB2ZHhcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIF9lbmNvZGVfdmR4OiAoIHZkeCApIC0+IFxcXG4gICAgKCAoIEBlbmNvZGVfaWR4IGlkeCBmb3IgaWR4IGluIHZkeCApLmpvaW4gJycgKS5wYWRFbmQgQGNmZy5fc29ydGtleV93aWR0aCwgQGNmZy5fY2lwaGVyXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBwYXJzZTogKCBzb3J0a2V5ICkgLT5cbiAgICBSID0gW11cbiAgICBmb3IgbGV4ZW1lIGluIEBsZXhlci5zY2FuX3RvX2xpc3Qgc29ydGtleVxuICAgICAgeyBuYW1lLFxuICAgICAgICBzdGFydCxcbiAgICAgICAgc3RvcCxcbiAgICAgICAgZGF0YSwgICAgICAgfSA9IGxleGVtZVxuICAgICAgIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICB7IGxldHRlcnMsXG4gICAgICAgIG1hbnRpc3NhLFxuICAgICAgICBpbmRleCwgICAgICB9ID0gZGF0YVxuICAgICAgbGV0dGVycyAgICAgICAgID0gbGV0dGVycy5qb2luICcnIGlmICggdHlwZV9vZiBsZXR0ZXJzICkgaXMgJ2xpc3QnXG4gICAgICBtYW50aXNzYSAgICAgICA/PSBudWxsXG4gICAgICBpbmRleCAgICAgICAgICA/PSBudWxsXG4gICAgICAjLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIFIucHVzaCB7IG5hbWUsIGxldHRlcnMsIG1hbnRpc3NhLCBpbmRleCwgfVxuICAgIHJldHVybiBSXG5cbiAgIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBkZWNvZGU6ICggc29ydGtleSApIC0+XG4gICAgIyMjIFRBSU5UIHVzZSBwcm9wZXIgdmFsaWRhdGlvbiAjIyNcbiAgICB1bmxlc3MgKCB0eXBlID0gdHlwZV9vZiBzb3J0a2V5ICkgaXMgJ3RleHQnXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzUgZXhwZWN0ZWQgYSB0ZXh0LCBnb3QgYSAje3R5cGV9XCJcbiAgICB1bmxlc3Mgc29ydGtleS5sZW5ndGggPiAwXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCLOqWhsbF9fXzYgZXhwZWN0ZWQgYSBub24tZW1wdHkgdGV4dCwgZ290ICN7cnByIHNvcnRrZXl9XCJcbiAgICBSID0gW11cbiAgICBmb3IgdW5pdCBpbiBAcGFyc2Ugc29ydGtleVxuICAgICAgaWYgdW5pdC5uYW1lIGlzICdvdGhlcidcbiAgICAgICAgbWVzc2FnZSAgID0gXCLOqWhsbF9fXzcgbm90IGEgdmFsaWQgc29ydGtleTogdW5hYmxlIHRvIHBhcnNlICN7cnByIHVuaXQubGV0dGVyc31cIlxuICAgICAgICBtZXNzYWdlICArPSBcIiBpbiAje3JwciBzb3J0a2V5fVwiIGlmIHNvcnRrZXkgaXNudCB1bml0LmxldHRlcnNcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yIG1lc3NhZ2VcbiAgICAgIFIucHVzaCB1bml0LmluZGV4IGlmIHVuaXQuaW5kZXg/XG4gICAgcmV0dXJuIFJcblxuICAjLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlY29kZV9pbnRlZ2VyOiAoIG4gKSAtPlxuICAgIHRocm93IG5ldyBFcnJvciBcIs6paGxsX19fOCBub3QgaW1wbGVtZW50ZWRcIlxuXG4jPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbm1vZHVsZS5leHBvcnRzID0gZG8gPT5cbiAgaG9sbGVyaXRoXzEwICAgICAgICA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEwXG4gIGhvbGxlcml0aF8xMG12cCAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMG12cFxuICBob2xsZXJpdGhfMTBtdnAyICAgID0gbmV3IEhvbGxlcml0aCBjb25zdGFudHNfMTBtdnAyXG4gIGhvbGxlcml0aF8xMjggICAgICAgPSBuZXcgSG9sbGVyaXRoIGNvbnN0YW50c18xMjhcbiAgaG9sbGVyaXRoXzEyOF8xNjM4MyA9IG5ldyBIb2xsZXJpdGggY29uc3RhbnRzXzEyOF8xNjM4M1xuICByZXR1cm4ge1xuICAgIEhvbGxlcml0aCxcbiAgICBob2xsZXJpdGhfMTAsXG4gICAgaG9sbGVyaXRoXzEwbXZwLFxuICAgIGhvbGxlcml0aF8xMG12cDIsXG4gICAgaG9sbGVyaXRoXzEyOCxcbiAgICBob2xsZXJpdGhfMTI4XzE2MzgzLFxuICAgIGludGVybmFscywgfVxuIl19
