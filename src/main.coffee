
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
  get_max_niners,
  get_max_integer,      } = SFMODULES.unstable.require_anybase()


#-----------------------------------------------------------------------------------------------------------
constants_128 = Object.freeze
  max_integer:  Number.MAX_SAFE_INTEGER + 1
  min_integer:  Number.MIN_SAFE_INTEGER - 1
  uniliterals:  'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷'
  zpun_max:     +20
  nun_min:      -20
  zero_pad_length: 8
  ###                     1         2         3       ###
  ###            12345678901234567890123456789012     ###
  alphabet:     '!#$%&()*+,-./0123456789:;<=>?@AB' + \
                'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + \
                'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + \
                '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
  ### TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
  be used, thus can be freed for other(?) things ###
  magnifiers:   'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_128b = Object.freeze
  max_integer:  Number.MAX_SAFE_INTEGER + 1
  min_integer:  Number.MIN_SAFE_INTEGER - 1
  uniliterals:  'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷'
  zpun_max:     +0
  nun_min:      -0
  zero_pad_length: 8
  ###                     1         2         3       ###
  ###            12345678901234567890123456789012     ###
  alphabet:     '!#$%&()*+,-./0123456789:;<=>?@AB' + \
                'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + \
                'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + \
                '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
  ### TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
  be used, thus can be freed for other(?) things ###
  magnifiers:   'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_10 = Object.freeze
  max_integer:  +999
  min_integer:  -999
  uniliterals:  'ÏÐÑ ã äåæ'
  zpun_max:     +3
  nun_min:      -3
  zero_pad_length:  3
  alphabet:     '0123456789'
  magnifiers:   'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_10mvp = Object.freeze
  max_integer:  +999
  min_integer:  -999
  uniliterals:  'N'
  zpun_max:     +0
  nun_min:      -0
  zero_pad_length:  3
  alphabet:     '0123456789'
  magnifiers:   'JKLM OPQR'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
constants_10mvp2 = Object.freeze
  max_integer:  +999
  min_integer:  -999
  uniliterals:  'EFGHIJKLM N OPQRSTUVW'
  zpun_max:     +9
  nun_min:      -9
  zero_pad_length:  3
  alphabet:     '0123456789'
  magnifiers:   'ABC XYZ'
  dimension:    5

#-----------------------------------------------------------------------------------------------------------
# constants = C = constants_128
constants = C = constants_10

#-----------------------------------------------------------------------------------------------------------
internals = Object.freeze { constants, types, }


#===========================================================================================================
class Hollerith

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    clasz           = @constructor
    @cfg            = Object.freeze clasz.validate_and_compile_cfg cfg
    @lexer          = @compile_sortkey_lexer @cfg
    return undefined

  #---------------------------------------------------------------------------------------------------------
  @validate_and_compile_cfg: ( cfg ) ->
    ### Validations: ###
    ### Derivations: ###
    hollerith_cfg_template =
      blank:  '\x20'
    R                     = clean_assign {}, hollerith_cfg_template, cfg
    T                     = new Hollerith_typespace { blank: R.blank, }
    R.alphabet            = T.alphabet.validate cfg.alphabet
    R.alphabet_chrs       = T.alphabet.data.alphabet_chrs
    R.niner               = T.alphabet.data.niner
    R.leading_niners_re   = T.alphabet.data.leading_niners_re
    R.base                = T.alphabet.data.base
    R.magnifiers          = T.magnifiers.validate cfg.magnifiers
    R.pmag                = T.magnifiers.data.pmag
    R.nmag                = T.magnifiers.data.nmag
    R.pmag_chrs           = T.magnifiers.data.pmag_chrs
    R.nmag_chrs           = T.magnifiers.data.nmag_chrs
    R.uniliterals         = T.uniliterals.validate cfg.uniliterals
    R.nuns                = T.uniliterals.data.nuns
    R.zpuns               = T.uniliterals.data.zpuns
    R.nun_chrs            = T.uniliterals.data.nun_chrs
    R.zpun_chrs           = T.uniliterals.data.zpun_chrs
    R.nun_min             = -R.nun_chrs.length
    R.zpun_max            = R.zpun_chrs.length - 1
    R.dimension           = T.dimension.validate cfg.dimension
    R.max_digits          = R.pmag_chrs.length - 1
    R.max_integer         = ( R.base ** R.max_digits ) - 1
    R.min_integer         = -R.max_integer
    #.......................................................................................................
    ### TAINT this can be greatly simplified with To Dos implemented ###
    R.TMP_alphabet  = T.TMP_alphabet.validate ( R.alphabet + ( \
      [ R.nmag_chrs..., ].reverse().join '' ) + \
      R.nuns                                  + \
      R.zpuns                                 + \
      R.pmag                                    ).replace T[CFG].blank_splitter, ''
    return R

  #---------------------------------------------------------------------------------------------------------
  compile_sortkey_lexer: ( cfg ) ->
    { nuns,
      zpuns,
      nmag,
      pmag,
      alphabet,     } = cfg
    # base              = alphabet.length
    #.......................................................................................................
    nuns_letters  = nuns
    puns_letters  = zpuns[  1 ..  ]
    nmag_letters  = nmag[   1 ..  ]
    pmag_letters  = pmag[   1 ..  ]
    zero_letters  = zpuns[  0     ]
    max_digit     = alphabet.at -1
    #.......................................................................................................
    fit_nun       = regex"(?<letters> [ #{nuns_letters} ]  )                                  "
    fit_pun       = regex"(?<letters> [ #{puns_letters} ]  )                                  "
    fit_nnum      = regex"(?<letters> [ #{nmag_letters} ]  ) (?<mantissa> [ #{alphabet}  ]* ) "
    fit_pnum      = regex"(?<letters> [ #{pmag_letters} ]  ) (?<mantissa> [ #{alphabet}  ]* ) "
    fit_padding   = regex"(?<letters> [ #{zero_letters} ]+ ) $                                "
    fit_zero      = regex"(?<letters> [ #{zero_letters} ]  (?= .* [^ #{zero_letters} ] ) )     "
    fit_other     = regex"(?<letters> .                    )                                  "
    all_zero_re   = regex"^ #{zero_letters}+ $"
    #.......................................................................................................
    cast_nun      = ({ data: d, }) -> d.index = ( cfg.nuns.indexOf d.letters ) - cfg.nuns.length
    cast_pun      = ({ data: d, }) -> d.index = +cfg.zpuns.indexOf  d.letters
    cast_nnum     = ({ data: d, }) ->
      mantissa  = d.mantissa.padStart cfg.zero_pad_length, max_digit
      d.index   = ( decode mantissa, alphabet ) - cfg.max_integer
    cast_pnum     = ({ data: d, }) -> d.index = decode d.mantissa, alphabet
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
      throw new Error "Ωhll___2 expected a float, got a #{type}"
    unless @cfg.min_integer <= n <= @cfg.max_integer
      throw new Error "Ωhll___3 expected a float between #{@cfg.min_integer} and #{@cfg.max_integer}, got #{n}"
    #.......................................................................................................
    return @encode_integer n

  #---------------------------------------------------------------------------------------------------------
  encode_integer: ( n ) ->
    ### NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` ###
    #.......................................................................................................
    # Zero or small positive:
    return ( @cfg.zpuns.at n ) if 0          <= n <= @cfg.zpun_max
    #.......................................................................................................
    # Small negative:
    return ( @cfg.nuns.at  n ) if @cfg.nun_min  <= n <  0
    #.......................................................................................................
    # Big positive:
    if n > @cfg.zpun_max
      R = encode n, @cfg.alphabet
      return ( @cfg.pmag.at R.length ) + R
    #.......................................................................................................
    # Big negative:
    ### NOTE plus one or not plus one?? ###
    # R = ( encode ( n + @cfg.max_integer + 1 ), @cfg.alphabet )
    R = ( encode ( n + @cfg.max_integer     ), @cfg.alphabet )
    # debug 'Ωhll___4', { n, R, }
    if R.length < @cfg.zero_pad_length
      R = R.padStart @cfg.zero_pad_length, @cfg.alphabet.at 0
      # debug 'Ωhll___5', { n, R, }
    else
      R = R.replace @cfg.leading_niners_re, ''
      # debug 'Ωhll___6', { n, R, }
    return ( @cfg.nmag.at R.length ) + R

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
      throw new Error "Ωhll___7 expected a text, got a #{type}"
    unless sortkey.length > 0
      throw new Error "Ωhll___8 expected a non-empty text, got #{rpr sortkey}"
    R = []
    for unit in @parse sortkey
      if unit.name is 'other'
        message   = "Ωhll___9 not a valid sortkey: unable to parse #{rpr unit.letters}"
        message  += " in #{rpr sortkey}" if sortkey isnt unit.letters
        throw new Error message
      R.push unit.index if unit.index?
    return R

  #---------------------------------------------------------------------------------------------------------
  decode_integer: ( n ) ->

#===========================================================================================================
module.exports = do =>
  hollerith_10      = new Hollerith constants_10
  hollerith_10mvp   = new Hollerith constants_10mvp
  hollerith_10mvp2  = new Hollerith constants_10mvp2
  hollerith_128     = new Hollerith constants_128
  hollerith_128b    = new Hollerith constants_128b
  return {
    Hollerith,
    hollerith_10,
    hollerith_10mvp,
    hollerith_10mvp2,
    hollerith_128,
    hollerith_128b,
    internals, }
