
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


#-----------------------------------------------------------------------------------------------------------
constants_128 = Object.freeze
  max_integer:  Number.MAX_SAFE_INTEGER
  min_integer:  Number.MIN_SAFE_INTEGER
  zpuns:        'ãäåæçèéêëìíîïðñòóôõö÷' # zero and positive uniliteral numbers
  nuns:         'ÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâ'  # negative          uniliteral numbers
  zpun_max:     +20
  nun_min:      -20
  zero_pad_length: 8
  alphabet:     '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`' \
                  + 'abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆ'
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
  # MLKJIHGFEDCBA
  # N XYZ
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
internals = Object.freeze { constants, }


#===========================================================================================================
class Hollerith

  #---------------------------------------------------------------------------------------------------------
  constructor: ( _TMP_constants ) ->
    @cfg = _TMP_constants
    @_compile_sorkey_re()
    return undefined

  #---------------------------------------------------------------------------------------------------------
  @_compile_sorkey_re: ->

    # @cfg.sortkey_re =
    return null

  #---------------------------------------------------------------------------------------------------------
  encode: ( integer_or_list ) ->
    ### TAINT use proper validation ###
    if Array.isArray integer_or_list
      return ( @encode n for n in integer_or_list ).join ''
    #.......................................................................................................
    n = integer_or_list
    unless Number.isFinite n
      type = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
      throw new Error "Ωhll___1 expected a float, got a #{type}"
    unless @cfg.min_integer <= n <= @cfg.max_integer
      throw new Error "Ωhll___2 expected a float between #{@cfg.min_integer} and #{@cfg.max_integer}, got #{n}"
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
    # debug 'Ωhll___3', { n, R, }
    if R.length < @cfg.zero_pad_length
      R = R.padStart @cfg.zero_pad_length, @cfg.alphabet.at 0
      # debug 'Ωhll___4', { n, R, }
    else
      R = R.replace @cfg.nlead_re, ''
      # debug 'Ωhll___5', { n, R, }
    return ( @cfg.nmag.at R.length ) + R

  #---------------------------------------------------------------------------------------------------------
  decode: ( sortkey ) ->
    ### TAINT use proper validation ###
    unless ( type = type_of sortkey ) is 'text'
      throw new Error "Ωhll___1 expected a text, got a #{type}"
    unless sortkey.length > 0
      throw new Error "Ωhll___1 expected a non-empty text, got #{rpr sortkey}"

  #---------------------------------------------------------------------------------------------------------
  decode_integer: ( n ) ->

#===========================================================================================================
module.exports = do =>
  hollerith_10      = new Hollerith constants_10
  hollerith_10mvp   = new Hollerith constants_10mvp
  hollerith_10mvp2  = new Hollerith constants_10mvp2
  hollerith_128     = new Hollerith constants_128
  return { Hollerith, hollerith_10, hollerith_10mvp, hollerith_10mvp2, hollerith_128, internals, }
