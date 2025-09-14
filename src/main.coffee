
'use strict'

#===========================================================================================================
# { encodeBigInt,
#   decodeBigInt,   } = TMP_require_encode_in_alphabet()
SFMODULES                 = require 'bricabrac-single-file-modules'
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ debug,                } = console
{ regex,                } = require 'regex'
{ Grammar
  Token
  Lexeme                } = require 'interlex'
types                     = require './types'
{ CFG,
  Hollerith_typespace,  } = types
{ clean_assign,         } = SFMODULES.unstable.require_clean_assign()
{ encode,
  decode,
  log_to_base,
  get_required_digits,
  get_max_integer,      } = SFMODULES.unstable.require_anybase()
{ freeze,               } = Object


#-----------------------------------------------------------------------------------------------------------
constants_128 = freeze
  uniliterals:  'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷'
  # _max_zpun:     +20
  # _min_nun:      -20
  # _max_idx_digits: 8
  ###                     1         2         3       ###
  ###            12345678901234567890123456789012     ###
  digitset:     '!#$%&()*+,-./0123456789:;<=>?@AB' + \
                'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + \
                'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + \
                '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
  ### TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
  be used, thus can be freed for other(?) things ###
  magnifiers:   'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_128_16383 = freeze
  uniliterals:  'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷'
  _max_idx_digits: 2
  ###                     1         2         3       ###
  ###            12345678901234567890123456789012     ###
  digitset:     '!#$%&()*+,-./0123456789:;<=>?@AB' + \
                'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + \
                'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + \
                '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
  ### TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
  be used, thus can be freed for other(?) things ###
  magnifiers:   'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:    5
  _max_integer: ( 128 ** 2 ) - 1 # 16383

#-----------------------------------------------------------------------------------------------------------
constants_10 = freeze
  uniliterals:  'ÏÐÑ ã äåæ'
  _max_zpun:     +3
  _min_nun:      -3
  _max_idx_digits:  3
  digitset:     '0123456789'
  magnifiers:   'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_10mvp = freeze
  uniliterals:  'N'
  _max_zpun:     +0
  _min_nun:      -0
  _max_idx_digits:  3
  digitset:     '0123456789'
  magnifiers:   'JKLM OPQR'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_10mvp2 = freeze
  uniliterals:  'EFGHIJKLM N OPQRSTUVW'
  _max_zpun:     +9
  _min_nun:      -9
  _max_idx_digits:  3
  digitset:     '0123456789'
  magnifiers:   'ABC XYZ'
  dimension:    3
  _max_integer: 999

#-----------------------------------------------------------------------------------------------------------
# constants = C = constants_128
constants = C = constants_10

#-----------------------------------------------------------------------------------------------------------
internals = freeze { constants, types, }


#===========================================================================================================
class Hollerith

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    clasz           = @constructor
    @cfg            = freeze clasz.validate_and_compile_cfg cfg
    @lexer          = @compile_sortkey_lexer @cfg
    return undefined

  #---------------------------------------------------------------------------------------------------------
  @validate_and_compile_cfg: ( cfg ) ->
    ### Validations: ###
    ### Derivations: ###
    hollerith_cfg_template =
      blank:        '\x20'
      dimension:   5
    R                     = clean_assign {}, hollerith_cfg_template, cfg
    T                     = new Hollerith_typespace { blank: R.blank, }
    R.digitset            = T.digitset.validate R.digitset
    R._digits_list        = T.digitset.data._digits_list
    R._naught             = T.digitset.data._naught
    R._nova               = T.digitset.data._nova
    R._leading_novas_re   = T.digitset.data._leading_novas_re
    R._base               = T.digitset.data._base
    R.magnifiers          = T.magnifiers.validate R.magnifiers
    R._pmag_list          = T.magnifiers.data._pmag_list
    R._nmag_list          = T.magnifiers.data._nmag_list
    R.uniliterals         = T.uniliterals.validate R.uniliterals
    R._cipher             = T.uniliterals.data._cipher
    R._nuns               = T.uniliterals.data._nuns
    R._zpuns              = T.uniliterals.data._zpuns
    R._nuns_list          = T.uniliterals.data._nuns_list
    R._zpuns_list         = T.uniliterals.data._zpuns_list
    R._min_nun             = -R._nuns_list.length
    R._max_zpun            = R._zpuns_list.length - 1
    R.dimension           = T.dimension.validate R.dimension
    #.......................................................................................................
    _max_idx_digits   = Math.min ( R._pmag_list.length - 1 ), ( R._max_idx_digits ? Infinity )
    R._max_idx_digits = T._max_digits_per_idx_$.validate _max_idx_digits, R._pmag_list
    #.......................................................................................................
    if R._max_integer?  then  R._max_integer  = T._max_integer_$.validate R._max_integer, R._base
    else                        R._max_integer  = T.create_max_integer_$ { _base: R._base, digits_numof: R._max_idx_digits, }
    #.......................................................................................................
    if R._nmag_list.length < R._max_idx_digits
      throw new Error "Ωhll___1 _max_idx_digits is #{R._max_idx_digits}, but there are only #{R._nmag_list.length} positive magnifiers"
    else if R._nmag_list.length > R._max_idx_digits
      R._nmag_list = freeze R._nmag_list[ .. R._max_idx_digits ]
    #.......................................................................................................
    if R._pmag_list.length < R._max_idx_digits
      throw new Error "Ωhll___3 _max_idx_digits is #{R._max_idx_digits}, but there are only #{R._pmag_list.length} positive magnifiers"
    else if R._pmag_list.length > R._max_idx_digits
      R._pmag_list = freeze R._pmag_list[ .. R._max_idx_digits ]
    #.......................................................................................................
    R._pmag               = R._pmag_list.join ''
    R._nmag               = R._nmag_list.join ''
    R._max_idx_width      = R._max_idx_digits + 1
    R._sortkey_width      = R._max_idx_width * R.dimension
    #.......................................................................................................
    R._min_integer        = -R._max_integer
    #.......................................................................................................
    ### TAINT this can be greatly simplified with To Dos implemented ###
    R._alphabet           = T._alphabet.validate ( R.digitset + ( \
      [ R._nmag_list..., ].reverse().join '' ) + \
      R._nuns                                  + \
      R._zpuns                                 + \
      R._pmag                                    ).replace T[CFG].blank_splitter, ''
    return R

  #---------------------------------------------------------------------------------------------------------
  compile_sortkey_lexer: ( cfg ) ->
    { _nuns,
      _zpuns,
      _nmag,
      _pmag,
      digitset,     } = cfg
    # _base              = digitset.length
    #.......................................................................................................
    nuns_letters  = _nuns
    puns_letters  = _zpuns[  1 ..  ]
    nmag_letters  = _nmag[   1 ..  ]
    pmag_letters  = _pmag[   1 ..  ]
    zero_letters  = _zpuns[  0     ]
    max_digit     = digitset.at -1
    #.......................................................................................................
    fit_nun       = regex"(?<letters> [ #{nuns_letters} ]  )                                  "
    fit_pun       = regex"(?<letters> [ #{puns_letters} ]  )                                  "
    fit_nnum      = regex"(?<letters> [ #{nmag_letters} ]  ) (?<mantissa> [ #{digitset}  ]* ) "
    fit_pnum      = regex"(?<letters> [ #{pmag_letters} ]  ) (?<mantissa> [ #{digitset}  ]* ) "
    fit_padding   = regex"(?<letters> [ #{zero_letters} ]+ ) $                                "
    fit_zero      = regex"(?<letters> [ #{zero_letters} ]  (?= .* [^ #{zero_letters} ] ) )     "
    fit_other     = regex"(?<letters> .                    )                                  "
    all_zero_re   = regex"^ #{zero_letters}+ $"
    #.......................................................................................................
    cast_nun      = ({ data: d, }) -> d.index = ( cfg._nuns.indexOf d.letters ) - cfg._nuns.length
    cast_pun      = ({ data: d, }) -> d.index = +cfg._zpuns.indexOf  d.letters
    cast_nnum     = ({ data: d, }) ->
      mantissa  = d.mantissa.padStart cfg._max_idx_digits, max_digit
      d.index   = ( decode mantissa, digitset ) - cfg._max_integer
    cast_pnum     = ({ data: d, }) -> d.index = decode d.mantissa, digitset
    cast_zero     = ({ data: d, }) -> d.index = 0
    cast_padding  = ({ data: d, source, hit, }) -> d.index = 0 if source is hit
    cast_other    = null
    #.......................................................................................................
    R           = new Grammar { emit_signals: false, }
    first       = R.new_level { name: 'first', }
    first.new_token   { name: 'nun',      fit: fit_nun,                  cast: cast_nun,      }
    first.new_token   { name: 'pun',      fit: fit_pun,                  cast: cast_pun,      }
    first.new_token   { name: 'nnum',     fit: fit_nnum,                 cast: cast_nnum,     }
    first.new_token   { name: 'pnum',     fit: fit_pnum,                 cast: cast_pnum,     }
    first.new_token   { name: 'padding',  fit: fit_padding,              cast: cast_padding,  }
    first.new_token   { name: 'zero',     fit: fit_zero,                 cast: cast_zero,     }
    first.new_token   { name: 'other',    fit: fit_other, merge: 'list', cast: cast_other,    }
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  encode: ( integer_or_list ) ->
    ### TAINT use proper validation ###
    if Array.isArray integer_or_list
      return ( @encode n for n in integer_or_list ).join ''
    #.......................................................................................................
    n = integer_or_list
    unless Number.isFinite n
      type = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
      throw new Error "Ωhll___4 expected a float, got a #{type}"
    unless @cfg._min_integer <= n <= @cfg._max_integer
      throw new Error "Ωhll___5 expected a float between #{@cfg._min_integer} and #{@cfg._max_integer}, got #{n}"
    #.......................................................................................................
    return @encode_integer n

  #---------------------------------------------------------------------------------------------------------
  encode_integer: ( n ) ->
    ### NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` ###
    #.......................................................................................................
    # Zero or small positive:
    return ( @cfg._zpuns.at n ) if 0          <= n <= @cfg._max_zpun
    #.......................................................................................................
    # Small negative:
    return ( @cfg._nuns.at  n ) if @cfg._min_nun  <= n <  0
    #.......................................................................................................
    # Big positive:
    if n > @cfg._max_zpun
      R = encode n, @cfg.digitset
      return ( @cfg._pmag.at R.length ) + R
    #.......................................................................................................
    # Big negative:
    ### NOTE plus one or not plus one?? ###
    # R = ( encode ( n + @cfg._max_integer + 1 ), @cfg.digitset )
    R = ( encode ( n + @cfg._max_integer     ), @cfg.digitset )
    if R.length < @cfg._max_idx_digits
      R = R.padStart @cfg._max_idx_digits, @cfg.digitset.at 0
    else
      R = R.replace @cfg._leading_novas_re, ''
    return ( @cfg._nmag.at R.length ) + R

  #---------------------------------------------------------------------------------------------------------
  parse: ( sortkey ) ->
    R = []
    for lexeme in @lexer.scan_to_list sortkey
      { name,
        start,
        stop,
        data,       } = lexeme
      #.....................................................................................................
      { letters,
        mantissa,
        index,      } = data
      letters         = letters.join '' if ( type_of letters ) is 'list'
      mantissa       ?= null
      index          ?= null
      #.....................................................................................................
      R.push { name, letters, mantissa, index, }
    return R

  #---------------------------------------------------------------------------------------------------------
  decode: ( sortkey ) ->
    ### TAINT use proper validation ###
    unless ( type = type_of sortkey ) is 'text'
      throw new Error "Ωhll___9 expected a text, got a #{type}"
    unless sortkey.length > 0
      throw new Error "Ωhll__10 expected a non-empty text, got #{rpr sortkey}"
    R = []
    for unit in @parse sortkey
      if unit.name is 'other'
        message   = "Ωhll__11 not a valid sortkey: unable to parse #{rpr unit.letters}"
        message  += " in #{rpr sortkey}" if sortkey isnt unit.letters
        throw new Error message
      R.push unit.index if unit.index?
    return R

  #---------------------------------------------------------------------------------------------------------
  decode_integer: ( n ) ->
    throw new Error "Ωhll__12 not implemented"

#===========================================================================================================
module.exports = do =>
  hollerith_10        = new Hollerith constants_10
  hollerith_10mvp     = new Hollerith constants_10mvp
  hollerith_10mvp2    = new Hollerith constants_10mvp2
  hollerith_128       = new Hollerith constants_128
  hollerith_128_16383 = new Hollerith constants_128_16383
  return {
    Hollerith,
    hollerith_10,
    hollerith_10mvp,
    hollerith_10mvp2,
    hollerith_128,
    hollerith_128_16383,
    internals, }
