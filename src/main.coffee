
'use strict'

#===========================================================================================================
# { encodeBigInt,
#   decodeBigInt,   } = TMP_require_encode_in_alphabet()
SFMODULES                 = require 'bricabrac-single-file-modules'
{ encode, decode,       } = SFMODULES.unstable.require_anybase()
{ type_of,              } = SFMODULES.unstable.require_type_of()
{ show_no_colors: rpr,  } = SFMODULES.unstable.require_show()
{ debug,                } = console
{ regex,                } = require 'regex'
{ Grammar
  Token
  Lexeme                } = require 'interlex'
types                     = require './types'
{ Hollerith_typespace,  } = types


#-----------------------------------------------------------------------------------------------------------
constants_128 = Object.freeze
  max_integer:  Number.MAX_SAFE_INTEGER + 1
  min_integer:  Number.MIN_SAFE_INTEGER - 1
  zpuns:        'ãäåæçèéêëìíîïðñòóôõö÷' # zero and positive uniliteral numbers
  nuns:         'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ'  # negative          uniliteral numbers
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
  pmag:         ' øùúûüýþÿ'  # positive 'magnifier' for 1 to 8 positive digits
  nmag:         ' ÎÍÌËÊÉÈÇ'  # negative 'magnifier' for 1 to 8 negative digits
  nlead_re:     /^2Æ*/      # 'negative leader', discardable leading digits of lifted negative numbers

#-----------------------------------------------------------------------------------------------------------
constants_128b = Object.freeze
  max_integer:  Number.MAX_SAFE_INTEGER + 1
  min_integer:  Number.MIN_SAFE_INTEGER - 1
  zpuns:        'ãäåæçèéêëìíîïðñòóôõö÷' # zero and positive uniliteral numbers
  nuns:         'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ'  # negative          uniliteral numbers
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
  pmag:         ' øùúûüýþÿ'  # positive 'magnifier' for 1 to 8 positive digits
  nmag:         ' ÎÍÌËÊÉÈÇ'  # negative 'magnifier' for 1 to 8 negative digits
  nlead_re:     /^2Æ*/      # 'negative leader', discardable leading digits of lifted negative numbers

#-----------------------------------------------------------------------------------------------------------
constants_10 = Object.freeze
  max_integer:  +999
  min_integer:  -999
  zpuns:        'ãäåæ' # zero and positive uniliteral numbers
  nuns:         'ÏÐÑ'  # negative          uniliteral numbers
  zpun_max:     +3
  nun_min:      -3
  zero_pad_length:  3
  alphabet:     '0123456789'
  pmag:         ' øùúûüýþÿ'   # positive 'magnifier' for 1 to 8 positive digits
  nmag:         ' ÎÍÌËÊÉÈÇ'   # negative 'magnifier' for 1 to 8 negative digits
  nlead_re:     /^9*(?=[0-9])/         # 'negative leader', discardable leading digits of lifted negative numbers

#-----------------------------------------------------------------------------------------------------------
constants_10mvp = Object.freeze
  max_integer:  +999
  min_integer:  -999
  zpuns:        'N' # zero and positive uniliteral numbers
  nuns:         ''  # negative          uniliteral numbers
  zpun_max:     +0
  nun_min:      -0
  zero_pad_length:  3
  alphabet:     '0123456789'
  pmag:         ' OPQR'   # positive 'magnifier' for 1 to 8 positive digits
  nmag:         ' MLKJ'   # negative 'magnifier' for 1 to 8 negative digits
  nlead_re:     /^9*(?=[0-9])/         # 'negative leader', discardable leading digits of lifted negative numbers

#-----------------------------------------------------------------------------------------------------------
constants_10mvp2 = Object.freeze
  max_integer:  +999
  min_integer:  -999
  zpuns:        'NOPQRSTUVW' # zero and positive uniliteral numbers
  nuns:         'EFGHIJKLM'  # negative          uniliteral numbers
  zpun_max:     +9
  nun_min:      -9
  zero_pad_length:  3
  alphabet:     '0123456789'
  pmag:         '  XYZ'   # positive 'magnifier' for 1 to 8 positive digits
  nmag:         '  CBA'   # negative 'magnifier' for 1 to 8 negative digits
  nlead_re:     /^9*(?=[0-9])/         # 'negative leader', discardable leading digits of lifted negative numbers

#-----------------------------------------------------------------------------------------------------------
# constants = C = constants_128
constants = C = constants_10

#-----------------------------------------------------------------------------------------------------------
internals = Object.freeze { constants, types, }


#===========================================================================================================
class Hollerith

  #---------------------------------------------------------------------------------------------------------
  constructor: ( _TMP_constants ) ->
    cfg             = { _TMP_constants..., }
    @cfg            = Object.freeze cfg
    @lexer          = @compile_sortkey_lexer @cfg
    return undefined

  #---------------------------------------------------------------------------------------------------------
  validate_and_compile_cfg: ( cfg ) ->
    ### Validations: ###
    ### Derivations: ###

    base            = alphabet.length
    [ nmag_bare_reversed,
      nmag_bare,  ] = magnifiers.split /\s+/
    nmag            = ' ' + nmag_bare_reversed.reverse()
    pmag            = ' ' + pmag_bare
    max_integer     = ( base ** dimension ) - 1
    min_integer     = -max_integer
    min_integer     = -max_integer
    return null

  #---------------------------------------------------------------------------------------------------------
  compile_sortkey_lexer: ( cfg ) ->
    { nuns,
      zpuns,
      nmag,
      pmag,
      alphabet,     } = cfg
    # base              = alphabet.length
    #.....................................................................................................
    nuns_letters  = nuns
    puns_letters  = zpuns[  1 ..  ]
    nmag_letters  = nmag[   1 ..  ]
    pmag_letters  = pmag[   1 ..  ]
    zero_letters  = zpuns[  0     ]
    max_digit     = alphabet.at -1
    #.....................................................................................................
    fit_nun       = regex"(?<letters> [ #{nuns_letters} ]  )                                  "
    fit_pun       = regex"(?<letters> [ #{puns_letters} ]  )                                  "
    fit_nnum      = regex"(?<letters> [ #{nmag_letters} ]  ) (?<mantissa> [ #{alphabet}  ]* ) "
    fit_pnum      = regex"(?<letters> [ #{pmag_letters} ]  ) (?<mantissa> [ #{alphabet}  ]* ) "
    fit_padding   = regex"(?<letters> [ #{zero_letters} ]+ ) $                                "
    fit_zero      = regex"(?<letters> [ #{zero_letters} ]  (?= .* [^ #{zero_letters} ] ) )     "
    fit_other     = regex"(?<letters> .                    )                                  "
    all_zero_re   = regex"^ #{zero_letters}+ $"
    #.....................................................................................................
    cast_nun      = ({ data: d, }) -> d.index = ( cfg.nuns.indexOf d.letters ) - cfg.nuns.length
    cast_pun      = ({ data: d, }) -> d.index = +cfg.zpuns.indexOf  d.letters
    cast_nnum     = ({ data: d, }) ->
      mantissa  = d.mantissa.padStart cfg.zero_pad_length, max_digit
      d.index   = ( decode mantissa, alphabet ) - cfg.max_integer
    cast_pnum     = ({ data: d, }) -> d.index = decode d.mantissa, alphabet
    cast_zero     = ({ data: d, }) -> d.index = 0
    cast_padding  = ({ data: d, source, hit, }) -> d.index = 0 if source is hit
    cast_other    = null
    #.....................................................................................................
    R           = new Grammar { emit_signals: false, }
    first       = R.new_level { name: 'first', }
    first.new_token   { name: 'nun',      fit: fit_nun,                  cast: cast_nun,      }
    first.new_token   { name: 'pun',      fit: fit_pun,                  cast: cast_pun,      }
    first.new_token   { name: 'nnum',     fit: fit_nnum,                 cast: cast_nnum,     }
    first.new_token   { name: 'pnum',     fit: fit_pnum,                 cast: cast_pnum,     }
    first.new_token   { name: 'padding',  fit: fit_padding,              cast: cast_padding,  }
    first.new_token   { name: 'zero',     fit: fit_zero,                 cast: cast_zero,     }
    first.new_token   { name: 'other',    fit: fit_other, merge: 'list', cast: cast_other,    }
    #.....................................................................................................
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
      throw new Error "Ωhll___5 expected a float, got a #{type}"
    unless @cfg.min_integer <= n <= @cfg.max_integer
      throw new Error "Ωhll___6 expected a float between #{@cfg.min_integer} and #{@cfg.max_integer}, got #{n}"
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
    # debug 'Ωhll___7', { n, R, }
    if R.length < @cfg.zero_pad_length
      R = R.padStart @cfg.zero_pad_length, @cfg.alphabet.at 0
      # debug 'Ωhll___8', { n, R, }
    else
      R = R.replace @cfg.nlead_re, ''
      # debug 'Ωhll___9', { n, R, }
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
      throw new Error "Ωhll__10 expected a text, got a #{type}"
    unless sortkey.length > 0
      throw new Error "Ωhll__11 expected a non-empty text, got #{rpr sortkey}"
    R = []
    for unit in @parse sortkey
      if unit.name is 'other'
        message   = "Ωhll__12 not a valid sortkey: unable to parse #{rpr unit.letters}"
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
