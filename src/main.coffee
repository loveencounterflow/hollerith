
'use strict'

#===========================================================================================================
{ encodeBigInt,
  decodeBigInt,   } = TMP_require_encode_in_alphabet()

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
# constants = C = constants_128
constants = C = constants_10

#-----------------------------------------------------------------------------------------------------------
internals = Object.freeze { constants, }


#===========================================================================================================
class Vindex

  #---------------------------------------------------------------------------------------------------------
  encode: ( integer_or_list ) ->
    ### TAINT use proper validation ###
    if Array.isArray integer_or_list
      return ( @encode n for n in integer_or_list ).join ''
    #.......................................................................................................
    n = integer_or_list
    unless Number.isFinite n
      type = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
      throw new Error "Ωvdx__42 expected a float, got a #{type}"
    unless C.min_integer <= n <= C.max_integer
      throw new Error "Ωvdx__43 expected a float between #{C.min_integer} and #{C.max_integer}, got #{n}"
    #.......................................................................................................
    return @encode_integer n

  #---------------------------------------------------------------------------------------------------------
  encode_integer: ( n ) ->
    ### NOTE call only where assured `n` is integer within magnitude of `Number.MAX_SAFE_INTEGER` ###
    #.......................................................................................................
    # Zero or small positive:
    return ( C.zpuns.at n ) if 0          <= n <= C.zpun_max
    #.......................................................................................................
    # Small negative:
    return ( C.nuns.at  n ) if C.nun_min  <= n <  0
    #.......................................................................................................
    # Big positive:
    if n > C.zpun_max
      R = encodeBigInt n, C.alphabet
      return ( C.pmag.at R.length ) + R
    #.......................................................................................................
    # Big negative:
    R = ( encodeBigInt ( n + C.max_integer + 1 ), C.alphabet )
    if R.length < C.zero_pad_length   then  R = R.padStart C.zero_pad_length, C.alphabet.at 0
    else                                    R = R.replace C.nlead_re, ''
    return ( C.nmag.at R.length ) + R
