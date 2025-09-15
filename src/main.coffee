
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
{ CFG,
  Hollerith_typespace,  } = require './types'
{ clean_assign,         } = SFMODULES.unstable.require_clean_assign()
{ encode,
  decode,
  log_to_base,
  get_required_digits,
  get_max_integer,      } = SFMODULES.unstable.require_anybase()
{ freeze,               } = Object
{ hide,
  set_getter,           } = SFMODULES.require_managed_property_tools()
test                      = require './test-hollerith'


#-----------------------------------------------------------------------------------------------------------
constants_128 = freeze
  uniliterals:        'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷'
  ###                           1         2         3       ###
  ###                  12345678901234567890123456789012     ###
  digitset:           '!#$%&()*+,-./0123456789:;<=>?@AB' + \
                      'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + \
                      'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + \
                      '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
  ### TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
  be used, thus can be freed for other(?) things ###
  magnifiers:         'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:          5

#-----------------------------------------------------------------------------------------------------------
constants_128_16383 = freeze
  uniliterals:        'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ ã äåæçèéêëìíîïðñòóôõö÷'
  ###                           1         2         3       ###
  ###                  12345678901234567890123456789012     ###
  digitset:           '!#$%&()*+,-./0123456789:;<=>?@AB' + \
                      'CDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abc' + \
                      'defghijklmnopqrstuvwxyz{|}~¡¢£¤¥' + \
                      '¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
  ### TAINT since small ints up to +/-20 are represented by uniliterals, PMAG `ø` and NMAG `Î` will never
  be used, thus can be freed for other(?) things ###
  magnifiers:         'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:          5
  digits_per_idx:     2

#-----------------------------------------------------------------------------------------------------------
constants_10 = freeze
  uniliterals:        'ÏÐÑ ã äåæ'
  digitset:           '0123456789'
  magnifiers:         'ÇÈÉÊËÌÍÎ øùúûüýþÿ'
  dimension:          5

#-----------------------------------------------------------------------------------------------------------
constants_10mvp = freeze
  uniliterals:        'N'
  digitset:           '0123456789'
  magnifiers:         'JKLM OPQR'
  dimension:          5

#-----------------------------------------------------------------------------------------------------------
constants_10mvp2 = freeze
  uniliterals:        'EFGHIJKLM N OPQRSTUVW'
  digitset:           '0123456789'
  magnifiers:         'ABC XYZ'
  dimension:          3
  digits_per_idx:     3

#-----------------------------------------------------------------------------------------------------------
constants_10_cardinal = freeze
  uniliterals:        'EFGHIJKLM N OPQRSTUVW'
  digitset:           '0123456789'
  magnifiers:         'ABC XYZ'
  cardinals_only:     true # nonegatives
  dimension:          3
  digits_per_idx:     3

#-----------------------------------------------------------------------------------------------------------
# constants = C = constants_128
constants = C = constants_10

#-----------------------------------------------------------------------------------------------------------
internals = freeze {
  constants,
  constants_128,
  constants_128_16383,
  constants_10,
  constants_10mvp,
  constants_10mvp2,
  constants_10_cardinal,
  types: ( require './types' ), }


#===========================================================================================================
class Hollerith

  #---------------------------------------------------------------------------------------------------------
  constructor: ( cfg ) ->
    clasz           = @constructor
    { cfg,
      types,      } = clasz.validate_and_compile_cfg cfg
    @cfg            = freeze cfg
    @lexer          = @compile_sortkey_lexer @cfg
    hide @, 'types',  types
    return undefined

  #---------------------------------------------------------------------------------------------------------
  @validate_and_compile_cfg: ( cfg ) ->
    ### Validations: ###
    ### Derivations: ###
    hollerith_cfg_template =
      blank:          '\x20'
      dimension:      5
      cardinals_only: false
    R                     = clean_assign {}, hollerith_cfg_template, cfg
    types                 = new Hollerith_typespace { blank: R.blank, }
    R.cardinals_only      = types.cardinals_only.validate R.cardinals_only
    R.digitset            = types.digitset.validate R.digitset
    R._digits_list        = types.digitset.data._digits_list
    R._naught             = types.digitset.data._naught
    R._nova               = types.digitset.data._nova
    R._leading_novas_re   = types.digitset.data._leading_novas_re
    R._base               = types.digitset.data._base
    R.magnifiers          = types.magnifiers.validate R.magnifiers, { cardinals_only: R.cardinals_only, }
    R._pmag_list          = types.magnifiers.data._pmag_list
    R._nmag_list          = types.magnifiers.data._nmag_list
    R.uniliterals         = types.uniliterals.validate R.uniliterals, { cardinals_only: R.cardinals_only, }
    R._cipher             = types.uniliterals.data._cipher
    R._nuns               = types.uniliterals.data._nuns
    R._zpuns              = types.uniliterals.data._zpuns
    R._nuns_list          = types.uniliterals.data._nuns_list
    R._zpuns_list         = types.uniliterals.data._zpuns_list
    if R._cipher isnt R._zpuns_list[ 0 ]
      throw new Error "Ωhll___1 internal error: _cipher #{rpr R._cipher} doesn't match _zpuns #{rpr R._zpuns}"
    R._min_nun            = if R._nuns_list? then -R._nuns_list.length else 0
    R._max_zpun           = R._zpuns_list.length - 1
    R.dimension           = types.dimension.validate R.dimension
    #.......................................................................................................
    R.digits_per_idx     ?= Math.min ( R._pmag_list.length - 1 ), ( R.digits_per_idx ? Infinity )
    R.digits_per_idx      = types.digits_per_idx.validate R.digits_per_idx, R._pmag_list
    R._max_integer        = types.create_max_integer { _base: R._base, digits_per_idx: R.digits_per_idx, }
    #.......................................................................................................
    unless R.cardinals_only
      if R._nmag_list.length < R.digits_per_idx
        throw new Error "Ωhll___2 digits_per_idx is #{R.digits_per_idx}, but there are only #{R._nmag_list.length} positive magnifiers"
      else if R._nmag_list.length > R.digits_per_idx
        R._nmag_list = freeze R._nmag_list[ .. R.digits_per_idx ]
    #.......................................................................................................
    if R._pmag_list.length < R.digits_per_idx
      throw new Error "Ωhll___3 digits_per_idx is #{R.digits_per_idx}, but there are only #{R._pmag_list.length} positive magnifiers"
    else if R._pmag_list.length > R.digits_per_idx
      R._pmag_list = freeze R._pmag_list[ .. R.digits_per_idx ]
    #.......................................................................................................
    R._pmag               = R._pmag_list.join ''
    R._nmag               = if R.cardinals_only then null else R._nmag_list.join ''
    R._max_idx_width      = R.digits_per_idx + 1
    R._sortkey_width      = R._max_idx_width * R.dimension
    #.......................................................................................................
    R._min_integer        = if R.cardinals_only then 0 else -R._max_integer
    #.......................................................................................................
    ### TAINT this can be greatly simplified with To Dos implemented ###
    ### TAINT while treatment of NUNs, ZPUNs is unsatisfactory they're scheduled to be removed anyways so
        we refrain from improving that ###
    nmags                 = if R.cardinals_only then '' else [ R._nmag_list..., ].reverse().join ''
    nuns                  = if R.cardinals_only then '' else R._nuns
    R._alphabet           = types._alphabet.validate ( R.digitset + \
      nmags                     + \
      ( nuns ? '' )             + \
      R._zpuns                  + \
      R._pmag                     ).replace types[CFG].blank_splitter, ''
    return { cfg: R, types, }

  #---------------------------------------------------------------------------------------------------------
  compile_sortkey_lexer: ( cfg ) ->
    { _nuns,
      _zpuns,
      _nmag,
      _pmag,
      digitset,     } = cfg
    # _base              = digitset.length
    include_negatives = not cfg.cardinals_only
    #.......................................................................................................
    puns_letters  = _zpuns[  1 ..  ]
    pmag_letters  = _pmag[   1 ..  ]
    zero_letters  = _zpuns[  0     ]
    max_digit     = digitset.at -1
    #.......................................................................................................
    fit_pun       = regex"(?<letters> [ #{puns_letters} ]  )                                  "
    fit_pnum      = regex"(?<letters> [ #{pmag_letters} ]  ) (?<mantissa> [ #{digitset}  ]* ) "
    fit_padding   = regex"(?<letters> [ #{zero_letters} ]+ ) $                                "
    fit_zero      = regex"(?<letters> [ #{zero_letters} ]  (?= .* [^ #{zero_letters} ] ) )     "
    fit_other     = regex"(?<letters> .                    )                                  "
    all_zero_re   = regex"^ #{zero_letters}+ $"
    #.......................................................................................................
    cast_pun      = ({ data: d, }) -> d.index = +cfg._zpuns.indexOf  d.letters
    cast_pnum     = ({ data: d, }) -> d.index = decode d.mantissa, digitset
    cast_zero     = ({ data: d, }) -> d.index = 0
    cast_padding  = ({ data: d, source, hit, }) -> d.index = 0 if source is hit
    cast_other    = null
    #.......................................................................................................
    if include_negatives
      nuns_letters  = _nuns
      nmag_letters  = _nmag[   1 ..  ]
      fit_nun       = regex"(?<letters> [ #{nuns_letters} ]  )                                  "
      fit_nnum      = regex"(?<letters> [ #{nmag_letters} ]  ) (?<mantissa> [ #{digitset}  ]* ) "
      cast_nun      = ({ data: d, }) -> d.index = ( cfg._nuns.indexOf d.letters ) - cfg._nuns.length
      cast_nnum     = ({ data: d, }) ->
        mantissa  = d.mantissa.padStart cfg.digits_per_idx, max_digit
        d.index   = ( decode mantissa, digitset ) - cfg._max_integer
    #.......................................................................................................
    R             = new Grammar { emit_signals: false, }
    first         = R.new_level { name: 'first', }
    first.new_token   { name: 'nun',      fit: fit_nun,                  cast: cast_nun,      } if include_negatives
    first.new_token   { name: 'pun',      fit: fit_pun,                  cast: cast_pun,      }
    first.new_token   { name: 'nnum',     fit: fit_nnum,                 cast: cast_nnum,     } if include_negatives
    first.new_token   { name: 'pnum',     fit: fit_pnum,                 cast: cast_pnum,     }
    first.new_token   { name: 'padding',  fit: fit_padding,              cast: cast_padding,  }
    first.new_token   { name: 'zero',     fit: fit_zero,                 cast: cast_zero,     }
    first.new_token   { name: 'other',    fit: fit_other, merge: 'list', cast: cast_other,    }
    #.......................................................................................................
    return R

  #---------------------------------------------------------------------------------------------------------
  encode: ( idx_or_vdx ) ->
    ### TAINT use proper validation ###
    @types.idx_or_vdx.validate idx_or_vdx
    switch type = @types.idx_or_vdx.data.type
      when 'idx' then return @encode_idx  idx_or_vdx
      when 'vdx' then return @_encode_vdx idx_or_vdx
    throw new Error "Ωhll___4 internal error: unknown type #{rpr type}"

  #---------------------------------------------------------------------------------------------------------
  encode_idx: ( idx ) -> @_encode_idx @types.idx.validate idx, @cfg._min_integer, @cfg._max_integer

  #---------------------------------------------------------------------------------------------------------
  _encode_idx: ( idx ) ->
    ### NOTE call only where assured `idx` is integer within magnitude of `Number.MAX_SAFE_INTEGER` ###
    #.......................................................................................................
    return ( @cfg._zpuns.at idx ) if 0              <= idx <= @cfg._max_zpun  # Zero or small positive
    return ( @cfg._nuns.at  idx ) if @cfg._min_nun  <= idx <  0               # Small negative
    #.......................................................................................................
    if idx > @cfg._max_zpun                                                 # Big positive
      R = encode idx, @cfg.digitset
      return ( @cfg._pmag.at R.length ) + R
    #.......................................................................................................
    if @cfg.cardinals_only
      throw new Error "Ωhll___5 unable to encode negative idx #{idx} with cardinals-only codec"
    R = ( encode ( idx + @cfg._max_integer     ), @cfg.digitset )           # Big negative
    if R.length < @cfg.digits_per_idx then R = R.padStart @cfg.digits_per_idx, @cfg.digitset.at 0
    else                                    R = R.replace @cfg._leading_novas_re, ''
    return ( @cfg._nmag.at R.length ) + R

  #---------------------------------------------------------------------------------------------------------
  encode_vdx: ( vdx ) -> @_encode_vdx @types.vdx.validate vdx

  #---------------------------------------------------------------------------------------------------------
  _encode_vdx: ( vdx ) -> \
    ( ( @encode_idx idx for idx in vdx ).join '' ).padEnd @cfg._sortkey_width, @cfg._cipher

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
      throw new Error "Ωhll___6 expected a text, got a #{type}"
    unless sortkey.length > 0
      throw new Error "Ωhll___7 expected a non-empty text, got #{rpr sortkey}"
    R = []
    for unit in @parse sortkey
      if unit.name is 'other'
        message   = "Ωhll___8 not a valid sortkey: unable to parse #{rpr unit.letters}"
        message  += " in #{rpr sortkey}" if sortkey isnt unit.letters
        throw new Error message
      R.push unit.index if unit.index?
    return R

  #---------------------------------------------------------------------------------------------------------
  decode_integer: ( n ) ->
    throw new Error "Ωhll___9 not implemented"

#===========================================================================================================
module.exports = do =>
  hollerith_10          = new Hollerith constants_10
  hollerith_10mvp       = new Hollerith constants_10mvp
  hollerith_10mvp2      = new Hollerith constants_10mvp2
  hollerith_10_cardinal = new Hollerith constants_10_cardinal
  hollerith_128         = new Hollerith constants_128
  hollerith_128_16383   = new Hollerith constants_128_16383
  return {
    Hollerith,
    hollerith_10,
    hollerith_10mvp,
    hollerith_10mvp2,
    hollerith_10_cardinal,
    hollerith_128,
    hollerith_128_16383,
    test,
    internals, }
