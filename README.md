

# Hollerith


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Hollerith](#hollerith)
  - [Compact Encoding](#compact-encoding)
    - [Motivation](#motivation)
  - [Invariants](#invariants)
- [See Also](#see-also)
  - [To Do](#to-do)
  - [Don't](#dont)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Hollerith

vectorial indices ('vindices' or VDXs) that allow for arbitrary many interstitial elements with a binary
sortable representation

## Compact Encoding

### Motivation






| +A       | +B   | +C       |     | −A                | −B   | −C       |
| -------: | ---: | ---:     | --- | ---:              | ---: | ---:     |
| +001     | 1    | **o1**   |     | 1000 + −999 = 1   | 001  | **k001** |
| +002     | 2    | **o2**   |     | 1000 + −998 = 2   | 002  | **k002** |
| +003     | 3    | **o3**   |     | 1000 + −997 = 3   | 003  | **k003** |
| +004     | 4    | **o4**   |     | 1000 + −996 = 4   | 004  | **k004** |
| +005     | 5    | **o5**   |     | 1000 + −995 = 5   | 005  | **k005** |
| +006     | 6    | **o6**   |     | 1000 + −994 = 6   | 006  | **k006** |
| +007     | 7    | **o7**   |     | 1000 + −993 = 7   | 007  | **k007** |
| +008     | 8    | **o8**   |     | 1000 + −992 = 8   | 008  | **k008** |
| +009     | 9    | **o9**   |     | 1000 + −991 = 9   | 009  | **k009** |
| +010     | 10   | **p10**  |     | 1000 + −990 = 10  | 010  | **k010** |
| +011     | 11   | **p11**  |     | 1000 + −989 = 11  | 011  | **k011** |
| +012     | 12   | **p12**  |     | 1000 + −988 = 12  | 012  | **k012** |
| +013     | 13   | **p13**  |     | 1000 + −987 = 13  | 013  | **k013** |
| +014     | 14   | **p14**  |     | 1000 + −986 = 14  | 014  | **k014** |
| +015     | 15   | **p15**  |     | 1000 + −985 = 15  | 015  | **k015** |
| ...      | ...  | ...      |     | ...         ...   | ...  | ...      |
| +985     | 985  | **q985** |     | 1000 + −015 = 985 | 85   | **l85**  |
| +986     | 986  | **q986** |     | 1000 + −014 = 986 | 86   | **l86**  |
| +987     | 987  | **q987** |     | 1000 + −013 = 987 | 87   | **l87**  |
| +988     | 988  | **q988** |     | 1000 + −012 = 988 | 88   | **l88**  |
| +989     | 989  | **q989** |     | 1000 + −011 = 989 | 89   | **l89**  |
| +990     | 990  | **q990** |     | 1000 + −010 = 990 | 0    | **m0**   |
| +991     | 991  | **q991** |     | 1000 + −009 = 991 | 1    | **m1**   |
| +992     | 992  | **q992** |     | 1000 + −008 = 992 | 2    | **m2**   |
| +993     | 993  | **q993** |     | 1000 + −007 = 993 | 3    | **m3**   |
| +994     | 994  | **q994** |     | 1000 + −006 = 994 | 4    | **m4**   |
| +995     | 995  | **q995** |     | 1000 + −005 = 995 | 5    | **m5**   |
| +996     | 996  | **q996** |     | 1000 + −004 = 996 | 6    | **m6**   |
| +997     | 997  | **q997** |     | 1000 + −003 = 997 | 7    | **m7**   |
| +998     | 998  | **q998** |     | 1000 + −002 = 998 | 8    | **m8**   |
| +999     | 999  | **q999** |     | 1000 + −001 = 999 | 9    | **m9**   |

* For positive numbers greater than zero as in **+A**:
  * **+B**: Remove leading zeroes, if any.
  * **+C**: Prepend a magnifier corresponding to the number of digits; longer numbers get a
    lexicographically bigger magnifier.

* For negative numbers greater than zero:
  * **−A**: Add `max_integer` plus one; this 'lifts' −999 to +1
  * **−B**: Do two things:
    * pad with leading zeroes up to the length of `max_integer` and
    * remove leading nines.
  * **−C**: ; Now absolutely small negative integers have few digits again while absolutely large ones have
    many digits again. Prepend a magnifier corresponding to the number of digits; numbers with more digits
    get a prefix that lexicographically precedes ones with fewer digits.

+000      0   n

## Invariants

* **`blank`**:        `' '`                     # separator used in `magnifiers` and `uniliterals`
* **`alphabet`**:     `'0123456789'`            # digits; length of `alphabet` is the `base`
* **`magnifiers`**:   `'ABC XYZ'`               #
* **`uniliterals`**:  `'EFGHIJKLM N OPQRSTUVW'` # negative uniliterals, blank, zero uniliteral, blank, positive uniliterals
* **`dimension`**:     `3`                      # number of indices supported

* **`zpuns`**:              `'NOPQRSTUVW'`    # DERIVED # zero and positive uniliteral numbers
* **`nuns`**:               `'EFGHIJKLM'`     # DERIVED # negative          uniliteral numbers
* **`max_integer`**:        `+999`            # DERIVED
* **`min_integer`**:        `-999`            # DERIVED
* **`zpun_max`**:           `+9`              # DERIVED # biggest   number representable as uniliteral
* **`nun_min`**:            `-9`              # DERIVED # smallest  number representable as uniliteral
* **`zero_pad_length`**:    `3`               # DERIVED !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! > 3
* **`base`**:               `10`              # DERIVED from length of alphabet
* **`nmag_chrs_reversed`**: `'ABC'`           # DERIVED from first part of `magnifiers`
* **`pmag_chrs`**:          `'XYZ'`           # DERIVED from latter part of `magnifiers`
* **`pmag`**:               `'  XYZ'`         # DERIVED from magnifiers  # positive 'magnifier' for 1 to 3 positive digits
* **`nmag`**:               `'  CBA'`         # DERIVED from magnifiers  # negative 'magnifier' for 1 to 3 negative digits
* **`nlead_re`**:           `/^9*(?=[0-9])/`  # DERIVED # 'negative leader', discardable leading digits of lifted negative numbers

* no codepoint is repeated
* only codepoints between U+0000 and U+10ffff are supported;
  * **NOTE** this needs re-writing string index access to array index access
* all codepoints must be be given in monotonically ascending order, both individually and when concatenated
  as `alphabet + nmag_chrs_reversed + nuns + zpuns` (with `blank`s elided)



# See Also

inspired by & thx to https://stately.cloud/blog/encoding-sortable-binary-database-keys/


## To Do


* **`[—]`** support codepoints beyond `U+ffff`; this needs re-writing string index access to frozen array
  index access

* **`[—]`** in `compile_sortkey_lexer`, fix derivation of `nuns_letters`, `puns_letters`, `nmag_letters`,
  `pmag_letters`, `zero_letters` to work for non-BMP codepoints

* **`[—]`** in `Hollerith_typespace.magnifiers`, `nmag_bare_reversed` and `pmag_bare` are derived as
  `x.split @[CFG].blank` where a RegEx compiled from `@[CFG].blank` (roughly as `new RegExp
  "(?:#{RegExp.escape @[CFG].blank})+", 'v'`) should be used

* **`[—]`** remove restriction that negative and positive magnifiers must have same length

* **`[—]`** replace `Hollerith_typespace.incremental_text()`, `Hollerith_typespace.decremental_text()` with
  `Hollerith_typespace.incremental()`, `Hollerith_typespace.decremental()` that
  * accept texts (to be turned into lists) and lists-of-characters
  * skip over `Hollerith_typespace[CFG].blank`s

* **`[—]`** avoid padding and reversing of character lists, rather, use appropriate indexes

* **`[—]`** avoid having to declare magnifiers that are entirely covered by uniliterals

* **`[—]`** re-implement `unstable-anybase-brics.coffee#encode()`, `unstable-anybase-brics.coffee#decode()`
  to avoid building intermediate values

* **`[—]`** re-name `Hollerith_typespace[CFG].alphabet` to `digits`, which frees `alphabet` to signify the
  complete, ordered, `blank`-separated list of characters used to define a given Hollerith number format

* **`[—]`** (-> Bric-A-Brac) implement a character analyzer that, given a string (or list, or set) of
  characters, returns a set of (RegEx-compatible) Unicode attributes that is common to all the characters in
  the input

* **`[—]`** implement a way to declare alphabets with **Unicode ranges**. A range is declared as `[a-z]`,
  with a lower and a higher single codepoint embedded in between `[`, `-`, `]` (there's no clash with `-`
  being used literally in an alphabet because `-` (U+002d) comes before `[` (U+005b), and the only character
  between `[` and `]` (U+005d) is `\\` (U+005c), thus `XYZ[\\-]]^_` can only be taken to mean `XYZ\\]^_`,
  `XYZ[[-]]^_` can only be taken to mean `XYZ[\\]^_`, and so on).

* **`[—]`** implement a way to declare RegExes...

  * **`[—]`** ... that should apply to *all* declared Hollerith letters and cause errors where not matched

  * **`[—]`** ... that cause non-conformant letters from the declared sets are silently skipped (such that a
    declaration of `'[\x00-\x7f]'` in conjunction with `{ skip_unless: /\p{L}/v, }`) gives the set of US
    7bit ASCII letters, how many there may ever be

## Don't

* **`[🚫]`** <del>implement a way to declare alphabets with Unicode ranges as in `a..z` or `[a..z]`, e.g. `{
  digits: 'A..DF..Z', }` is equivalent to uppercase ASCII `A` thru `Z` with `E` excluded (this still
  leaves room for doubt how to interpret `&...5`: is it `/[[&-.]5]/v` i.e. `"&'()*+,-.5"` or is it
  `/[&[.-5]]/v` i.e. `"&./012345"`?)</del>