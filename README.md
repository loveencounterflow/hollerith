
![](https://github.com/loveencounterflow/hollerith/raw/master/art/hollerith-logo-v2.png)
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [hollerith](#hollerith)
- [Theory](#theory)
  - [What is LevelDB?](#what-is-leveldb)
  - [The Hollerith2 Codec (H2C)](#the-hollerith2-codec-h2c)
    - [Performance Considerations](#performance-considerations)
    - [Encoding Details](#encoding-details)
      - [Texts (Strings)](#texts-strings)
      - [Numbers](#numbers)
      - [Dates](#dates)
      - [Singular Values](#singular-values)
      - [PODs and Maps](#pods-and-maps)
      - [Private Types](#private-types)
    - [Lexicographic Order and UTF-8](#lexicographic-order-and-utf-8)
    - [X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X](#x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x-x)
  - [The Hollerith2 Phrase Structure](#the-hollerith2-phrase-structure)
    - [SPO and POS](#spo-and-pos)
- [Practice](#practice)
  - [Inserting Data](#inserting-data)
  - [Indexing Data](#indexing-data)
  - [Deleting Data](#deleting-data)
  - [Reading Data](#reading-data)
  - [Error Handling](#error-handling)
    - [@create_phrasestream = ( db, lo_hint = null, hi_hint = null ) ->](#@create_phrasestream---db-lo_hint--null-hi_hint--null---)
    - [@create_facetstream = ( db, lo_hint = null, hi_hint = null ) ->](#@create_facetstream---db-lo_hint--null-hi_hint--null---)
    - [@read_sub = ( db, settings, read ) ->](#@read_sub---db-settings-read---)
  - [Secondary Indexes](#secondary-indexes)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



# hollerith

[![Build Status](https://travis-ci.org/loveencounterflow/hollerith2.png)](https://travis-ci.org/loveencounterflow/hollerith)

> Use LevelDB like 1960s punched cards

<!-- HollerithÂ² is a NodeJS v0.12.x-compatible library written in 100% CoffeeScript to
write and read to and from  -->

```
npm install --save hollerith
```

# Theory

## What is LevelDB?

LevelDB is fast key / value embedded database engine developed and opensourced by
Google and made readily available to NodeJS folks as `npm install level` (see
[level](https://github.com/level/level) and
[levelup](https://github.com/rvagg/node-levelup)).

LevelDB is very focussed on doing this one thingâ€”being a key/value storeâ€”and forgoes a lot of features
you might expect a modern database should provide; in particular, LevelDB

* is a pure in-process DB; there are no other communication mechanisms like an HTTP API or somesuch;
* does not provide indexes on data;
* does not have data types or even have a concept of string encodingâ€”all keys and values are just
  arbitrary byte sequences;
* does not have intricate transaction handling (although it does feature compound batch operations that
  either succeed or fail with no partial commits);

What LevelDB does have, on the other hand is this (names given are for `hollerith` plus, in brackets,
their equivalents in `levelup`):

* **a `set key, value` (`levelup`: `put`) operation that stores a key / value pair (let's call that a 'facet' for short),**
* **a `get key` (`levelup`: `get`) operation that either yields the value that was `put` under that key, or else throws an
  error in case the key is not found,**
* **a `drop key` (`levelup`: `del`) operation that erases a key and its value from the records,**

and, most interestingly:

* **a `read ...` (`levelup`: `createReadStream`) operation that walks over keys, lexicographically
  ordered by their byte sequences; this can optionally be confined by setting a lower and an upper bound**.


<!-- Now LevelDBâ€”the DB engine underlying HollerithÂ²â€”is a key / value store that has
exactly one value per key. All keys are lexicographically ordered, and there are
only two ways to retrieve an entry from the datastore: either by giving the
full, exact key that a value was stored under, or by iterating over all key /
value pairs, optionally by giving a lower and / or an upper boundary for the
keys.

> There is no way in LevelDB to query values as such; the best you can do is to
> retrieve (all or a subset of the) key / value pairs and sort out matching
> values in your application code. This can make a lot of sense especially if
> you can limit the amount of key / value pairs to look at, but becomes
> unbearably slow if you have stored millions of facts and have to sift through
> all of them in order to find the single needle in the haystack.
 -->

## The Hollerith2 Codec (H2C)

![tape code pocket rule](https://github.com/loveencounterflow/hollerith2/raw/master/art/fairchild-tts-tape-code-pocket-rule-1200rgb-verso-rot0p6cw-crop-7744x1736-scale-1024x230.jpg)

Hollerith comes with its own codec, dubbed the HollerithÂ² Codec, or H2C for
short. It works like a subset of the [`bytewise`
codec](https://github.com/deanlandolt/bytewise) whose core implementation ideas
are shamelessly re-implemented.

### Performance Considerations

The `bytewise` codec is one great idea; it allows us to build LevelDB keys from
JavaScript lists of values that sort properly: keys encoded with `bytewise` will
keep apart data types in their own segments of the key space, sort numbers
properly by their magnitudes and correctly order strings by the lexicographic
ordering imposed by their constituent Unicode code points. If you wanted to do the
same just using strings as keys and JSON-like value seriealizations, you'd have to
construct everything very carefully to ensure this same set of desirable properties.

Not least, since the JSON representation of integer numbers is a series of
digits, you'd have to left-pad all your integers with zeroes to get it right;
this is because the strings `'4'`, `'6'`, `'12'`, `'333'` sort as `'12'`,
`'333'`, `'4'`, `'6'`. Only when padded with zeros they sort as `'004'`,
`'006'`, `'012'`, `'333'`â€”but even this doesn't ensure proper sorting when
numbers like `4.562e24` should occur. Even the JSON representation of strings
may become a problem with some code points; for example, a null byte will be
represented as the character sequence `"\u0000"` in JSON, with a literal slash
as the first character. Now Unicode encodes the slash as U+005c, while `A` is
U+0041 (i.e. smaller than U+005c) and `a` is U+0061 (i.e. greater than U+005c);
the net effect is that null bytes will sort *after* Basic Latin capital letters
Aâ€”Z, but *before* Basic Latin lower case letters aâ€”z.

`bytewise` has none of these issues. Sadly, it is considerably slower than JSON.
When you do `npm run benchmark`, you will get an output
like below; the figures in the `DT` column show the number of seconds needed to
process 100'000 arbitrary probes; the `REL` column shows relative times in
comparison to JSON, while the `MAX` column show relative times in comparison to
the slowest test case:

```
hollerith-codec â–º npm run benchmark
NAME                               DT  REL  MAX
bytewise.encode           4.441503192 8.51 1.00
new Buffer JSON.stringify 0.521810996 1.00 0.12
H2C.encode                1.471865467 2.82 0.33
```

Roughly speaking, `bytewise` (v1.1.0) achieves less than 12% of the throughput
that would be achievable by first encoding each probe to JSON and then turning
the resulting string into a buffer. By comparison, the H2C codec allows for
around 35% throughput of the JSON solution. Since H2C has not been aggressively
optimized, further performance gains are not impossible.

### Encoding Details

H2C is much more restrictive than `bytewise`. `bytewise` strives to support all
JavaScript data types (including objects) and to work in both the browser and in
NodeJS. By contrast, H2C is not currently designed to run in the browser. Also,
it only supports lists as keys whose elements can only be

* lists (which may be nested),
* `null`,
* `false`,
* `true`,
* numbers (including `Infinity`),
* Date objects, or
* strings.

This means that when working with HollerithÂ², you will always have
to use lists of JavaScript primitive types for the keys. This is a
good thing: because of the way that the H2C encoding works, putting
a number of lists like, say

```
[ 'sku', '3345-d', 'price', ]                       # â?«          â?«
[ 'sku', '3345-d', 'weight', ]                      # â?ª          â?¬ `sku`, `3345-d`
[ 'sku', '3345-d', 'description', ]                 # â?¬ `sku`    â?­ subspace
[ 'sku', '3348A',  'price', ]                       # â?ª subspace â?«
[ 'sku', '3348A',  'weight', ]                      # â?ª          â?¬ `sku`, `3348A`
[ 'sku', '3348A',  'description', ]                 # â?­          â?­ subspace
[ 'invoice', ( new_date "2012-01-30" ), '33421', ]  # â?«
[ 'invoice', ( new_date "2012-01-30" ), '66345', ]  # â?¬ `invoice`
[ 'invoice', ( new_date "2012-01-31" ), '54662', ]  # â?­ subspace
```

into the DB will cause them to occupy clearly delineated portions of the ordered
key space, meaning that it is easy to retrieve, say, all data related to
stock-keeping units by searching for the prefix (a.k.a. incomplete key) `[
'sku', ]`; if you're only interested in the SKU designated `3348A`, you can
iterate over that subspace using the prefix `[ 'sku', '3348A', ]`.

In other words, desirable properties of DB indexesâ€”namely, unique keys that are
hierarchically partitioned into disjunct, addressable subspacesâ€”fall out
naturally from the rather simple, efficient and straight-forward encoding
afforded by H2C.


<!--
```coffee
tms = HOLLERITH2[ 'CODEC' ][ 'typemarkers' ]

                                         Value        Length
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
tms[ 'lo'         ] =                     0x00             1
tms[ 'null'       ] = 'B'.codePointAt 0 # 0x42             1
tms[ 'false'      ] = 'C'.codePointAt 0 # 0x43             1
tms[ 'true'       ] = 'D'.codePointAt 0 # 0x44             1
tms[ 'date'       ] = 'G'.codePointAt 0 # 0x47            10
tms[ 'ninfinity'  ] = 'J'.codePointAt 0 # 0x4a             1
tms[ 'nnumber'    ] = 'K'.codePointAt 0 # 0x4b             9
tms[ 'pnumber'    ] = 'L'.codePointAt 0 # 0x4c             9
tms[ 'pinfinity'  ] = 'M'.codePointAt 0 # 0x4d             1
tms[ 'text'       ] = 'T'.codePointAt 0 # 0x54    (variable)
tms[ 'hi'         ] =                     0xff             1
```
 -->

#### Texts (Strings)

The H2C encoding for strings is almost binary compatible to the `bytewise`
encoding of strings that are elements in lists (since H2C only encodes values in
lists). The basic ideas are the following:

* The beginning of a string is indicated by a typemarker byte (`0x54 â‰™ 'T'` at the moment);
* its end is indicated by a terminating zero byte (`0x00`).
* Since `0x00` must, thus, not occur inside a string, all occurrances of `0x00`
  bytes are replaced by the sequence `0x01 0x01`, and all occurrances of `0x01`
  bytes are replaced by the sequence `0x01 0x02`. That way, the lexicographic
  ordering of 'low bytes' is preserved.
* The resulting zero-byte-free string is encoded as UTF-8, an encoding scheme
  that maps positive integer numbers big and small to octet bit patterns in a
  way that preserves Unicode code point ordering.
* No other normalization is done on strings. (If you want to, say, index a
  database with entries in a a 'complex script' that uses decomposable sequences
  of diacritics and so on, it's your own repsonsibility to apply a Unicode
  Normalization Form or other transforms; such concerns are outside the scope of
  H2C.)
* To decode an encoded string, the buffer is searched, from the typemarker byte
  onwards, for a zero byte; when it is found, the part between the initial and
  the terminal markers is decoded as UTF-8, and escaped 'low bytes' are
  unescaped.

#### Numbers

Like H2C's string encoding, H2C's encoding of numbers has been copied from `bytewise`.
Its characteristics are:

* The beginning of numbers is indicated by a typemarker byte that changes according
  to whether or not the number is finite and whether or not it is negative:
  * Negative infinity is marked by a sole `0x4a â‰™ 'J'`, positive infinity as a
    sole `0x4d â‰™ 'M'`; these two non-finite numbers are only captured by their
    typemarkers.
  * Negative finite numbers are marked with `0x4b â‰™ 'K'`, positive finite
    numbers as `0x4c â‰™ 'L'`.
* Finite numbers are written into the result buffer using `Buffer.writeDoubleBE()`,
  which means that
  * all finite numbers take up 1 + 8 = 9 bytes of space;
  * the lexicographical ordering of the binary representation of finite numbers
    is in direct relationship to the mathematical ordering of the values they represent;
  * no one is left behind, i.e. all the critical tiny, big and small values of
    JavaScript (resp. the IEEE-754 standard) like `Number.MIN_VALUE`, `Number.EPSILON`,
    `Number.MAX_SAFE_INTEGER` and so on are correctly handled without any distortions
    or rounding errors.
* The bytes of an encoded negative number are obtained by taking the absolute
  value of that number, encoding it with `Buffer.writeDoubleBE()` and then
  inversing its bits (so that e.g. `0x00` becomes `~0x00` == `0xff`); that way,
  the mathematically correct ordering `... -3 ... -2 ... -1 ... -0.5 ...` is
  obtained. Since the leading byte marker of negative numbers is smaller than
  the one for positive numbers, all encoded keys with negative numbers will
  collectively come before any positive number (including zero).

#### Dates

Dates are encoded with a leading typemarker for dates (`0x47 â‰™ 'G'` in case you where
wondering), followed by 9 bytes necessary to [encode finite numbers](#numbers), since
H2C uses the underlying milliseconds-since-epoch (1st of January, 1970) to
characterize dates. This means that

* in contradistinction to pure numbers, no infinitely distant dates can be encoded,
  since JavaScript doesn't accept `new Date( Infinity )`;
* dates will be ordered according to their relative temporal ordering, earlier dates coming
  before later dates; however
* additional information such as time zones will be irretrievably lost.

As an experimental feature, two extreme dates:

```coffee
sentinels = HOLLERITH2[ 'CODEC' ][ 'sentinels' ]
sentinels[ 'firstdate' ] = new Date -8640000000000000 # â‰™ Tue, 20 Apr -271821 00:00:00 GMT
sentinels[ 'lastdate'  ] = new Date +8640000000000000 # â‰™ Sat, 13 Sep  275760 00:00:00 GMT
```

are provided by the HollerithÂ² Codec module. According to [a website with
copious information about JS Date
objects](http://www.merlyn.demon.co.uk/js-datex.htm), these should represent the
earliest and latest dates possible with JavaScript (in fact, if you try the
above formulas with `1` subtracted or added to the arguments, you will get an
`Invalid Date` error).


#### Singular Values

A so-called 'singular' encoding is used to capture the solitary values `null`,
`false` and `true`; these are expressed as their type markers `0x42 â‰™ 'B'`
`0x43 â‰™ 'C'` `0x44 â‰™ 'D'`, respectively.

#### PODs and Maps

H2C does not accept plain old dictionaries (PODs, a.k.a. 'objects') for the
simple reason that the ordering of name / value pairs on objects is not very
well defined: while all JS engines basically do try and maintain the ordering of names in objects so they keep the sequence in which they were added to the
object, although this is just a convention and not strictly part of the
standard. On the other hand, V8 [treats keys that look like 32-bit unsigned
integer literals](https://code.google.com/p/v8/issues/detail?id=164) differently. The net effect is that answering what ordering you will see
when doing `Object.keys x` or `for name, value of x` against some POD `x`
is somewhat of a thorny issue, which makes objects patently unsuited for
building sorted indexes.

On the bright side, one can always fall back to ordinary flat or nested lists of values (with the semantics of the values being positionally defined),
use `[ name, value, ]` pairs (facets) enumerated in a list, or have a look
at H2C's [Private Types](#private-types).

> Incidentally, [ES6 Maps](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map) *do* preserve ordering of facets as per the
> standard, so it is conceivable that they will be added to H2C in the
> future.


#### Private Types

Sometimes it is practical or necessary to keep some class of values
separate from other classes, to arbitrate (translate) between the
values that go into the index and the values that the rest of
the application gets to see, or to support data types that are not directly
supported by H2C. For these use cases, there are so-called 'Private Types'.

To demonstrate the use of private types, let's consider the case where
you have stored, as keys in your database, a number of texts associated
with some kind of values. Later on, you discover you also want to have
an index to some files in the file system. Of course, files (and web content)
are commonly refered to by way of routes (paths, filenames), which are
nothing but specially-formatted strings that are given special semantics
when fed to, say, a method to open a file.

Now what you'd like to do is to both keep the routes apart from the other
strings in the index, and to make it so that the indexed routes lend
themselves to common search tasks. The latter part can be achieved
by splitting each route `foo/bar/baz` into its constituent parts and
use the resulting lists `[ 'foo', 'bar', 'baz', ]` as keys (thereby
avoiding the sorting issues that you might run into when some
part contains code points below `/` `U+002f`). However, routes are
still not marked up as routesâ€”they look like any other list of strings.
With private types, that's easy to achieve.

To work with private types, we need a way to *encode* ('prepare') a piece of
data, a way to *store* that encoded piece of data, and, after retrieval,
to *decode* ('interpret') it again to resurrect the original. In our
example, a **route encoder** might look like this:

```coffee
route_encoder = ( value ) -> value.split '/'
```

This is just a function that accepts a text and returns the result
of splitting that text using `/` as seperator.

A **route decoder** (which should accept a `type` and a `value`,
the reason for which will become apparent below) should turn a
suitable list back into a string by joining the parts with `/`:

```coffee
route_decoder = ( type, value ) ->
  ### NB a more capable decoder could acccept any number of different types ###
  return value.join '/' if type is 'route'
  throw new Error "unknown private type #{rpr type}"
```

Now that we have a way to encode and decode custom types, we're ready
to demonstrate how keys are formed for storage: In the below snippet,
we take a `value`, encode it, and then, crucially, we wrap it
into an object that receives a `type` annotation and the encoded value;
this *typed value* can then be used as part of a H2C key (which
must always be lists, so we just put the typed value inside of one).

> Needless to say that both the encoding and the wrapping
> could and maybe should be done in a single step.

The wrapping works because `CODEC.encode` ordinarily does not accept
objects (as per the [preceding section](#pods-and-maps)), so when it
does get to see an object, it assumes a private type object (which should
have a `type` and a `value` member; where `type` is missing, `'private'`
will be taken as the default type annotation).

Finally, we decode the key again using `CODEC.decode`, to which we pass
our decoder as an additional argument; for our demo, we then
print some informative data to the console:

```coffee
value         = '/etc/cron.d/anacron'
encoded_value = route_encoder value
typed_value   = { type: 'route', value: encoded_value, }
key           = [ typed_value, ]
key_bfr       = CODEC.encode key
#.....................................................................
# ... store some value using `key_bfr` ...
# ... retrieve `key_bfr` from database ...
#.....................................................................
decoded_key   = CODEC.decode key_bfr, route_decoder
debug CODEC.rpr_of_buffer key_bfr
debug CODEC.decode key_bfr
debug decoded_key
```

The above code will print three lines; first up, there's a nifty
representation of what the key-as-buffer looks like; comparing this
with similar displays in this document, you can readily deduce
that private types get a `Z` (`0x5a`) as type marker, which indeed
serves to keep apart all private types from all other data:

```
<Buffer 5a 45 54 72 6f 75 74 65 00 ...> ZETrouteâˆ‡ETâˆ‡Tetcâˆ‡Tcron.dâˆ‡Tanacronâˆ‡âˆ‡âˆ‡
```

Decoding this byte sequence naively (without the use of a dedicated decoder)
will result in the application of a default decoder which resurrects
an object with a `type` and a `value` member:

```
[ { type: 'route', value: [ '', 'etc', 'cron.d', 'anacron' ] } ]
```

Lastly, decoding the same byte sequence using our `route_decoder`, we do
in fact get back the route that we started with (again wrapped inside a list
because all H2C keys are lists):

```
[ '/etc/cron.d/anacron' ]
```

Our custom decoder did not preserve the type annotation, the
assumption being that at this point we do not need it anymore.
Of course, we could have chosen to make the decoder return
some more elaborate piece of data.

Our sample `route_decoder` was written so that it would
only accept data of known types and throw an error otherwise;
this is a good way to make sure no unexpected data slips
through. But since sometimes what you want is rather to
mangle only types that need mangling and leave other
types in their default shapes, H2C's `decode` offers a
simple way to do just that, as the following code from
the tests clarifies:

```coffee
@[ "private type takes default shape when handler returns use_fallback" ] = ( T ) ->
  matcher       = [ 84, { type: 'bar', value: 108, }, ]
  key           = [ { type: 'foo', value: 42, }, { type: 'bar', value: 108, }, ]
  key_bfr       = CODEC.encode key
  #.........................................................................................................
  decoded_key   = CODEC.decode key_bfr, ( type, value, use_fallback ) ->
    return value * 2 if type is 'foo'
    return use_fallback
  #.........................................................................................................
  T.eq matcher, decoded_key
```

The convention here is that the callback that is passed to
`decode` may choose to take a third argument, `use_fallback`,
which, when returned in place of a computed value, will cause
`decode` to put the private type's default shape (i.e.
an object `{ type, value, }`) into the key.

> Note that `undefined` is not an acceptable return value for the decoder, both
> because `undefined` is not an acceptable type to encode keys with, and
> also to avoid spurious occurrences of `undefined` in decoded keys
> where you forgot to either handle the type, throw an error or return an
> explicit 'I don't care' value.


### Lexicographic Order and UTF-8

![](https://github.com/loveencounterflow/hollerith/raw/master/art/hollerith.png)


The term '[lexicographically ordered](http://en.wikipedia.org/wiki/Lexicographical_order)' deserves some
explanation: lexicographical ordering (in computer science) is somewhat different from alphabetical ordering
(used in phone directories, card files and dictionaries) in that *only the underlying bits of the binary
representation* are considered in a purely mechanical way to decide what comes first and what comes next;
there are no further considerations of a linguistic, orthographic or cultural nature made.

Because early computers *were* in fact mechanical beasts that operated quite
'close to the metal' (resp. the holes on punched cards that were detected with
rods, electric brushes, or photosensors, as the case may be), the bit-level
details of early encoding schemes (such as
[EBCDIC](https://en.wikipedia.org/wiki/EBCDIC) or
[US-ASCII](https://en.wikipedia.org/wiki/ASCII)) had a very direct impact on
whether or not you could sort that huge card deck with customer names and sales
figures in a convenient manner using period machinery. Incidentally, this
consideration is the reason why, to this day, Unicode's first block (Basic
Latin, a holdover from the 1960s' 7bit ASCII standard) looks so orderly with its
contiguous ranges that comprise the digits `0`&nbsp;â‹¯&nbsp;`9`, the upper case
letters `A`&nbsp;â‹¯&nbsp;`Z`, and the lower case letters `a`&nbsp;â‹¯&nbsp;`z`, all
of them in alphabetic respectively numerical order. As shown below, this
property makes binary-based lexicographic sorting straightforward and intuitive.
The table also shows that as soon as we leave that comfort zone, the equivalence
between alphabetical and lexicographical ordering breaks down quickly:



|  nr | chr |    CID     |     UTF-8 octets (hex.)     |                UTF-8 (binary)                |
| --: | --- | ---------: | --------------------------- | -------------------------------------------- |
|   1 | â?€*  |      `u/0` | <tt>00</tt>                 | <tt>00000000</tt>                            |
|   2 | 0   |     `u/30` | <tt><b>30</b></tt>          | <tt>00â–²10000</tt>                            |
|   3 | 1   |     `u/31` | <tt><b>31</b></tt>          | <tt>0011000â–²</tt>                            |
|   4 | 2   |     `u/32` | <tt><b>32</b></tt>          | <tt>001100â–²0</tt>                            |
|   5 | A   |     `u/41` | <tt><b>42</b></tt>          | <tt>0â–²000001</tt>                            |
|   6 | B   |     `u/42` | <tt><b>42</b></tt>          | <tt>010000â–²0</tt>                            |
|   7 | C   |     `u/43` | <tt><b>43</b></tt>          | <tt>0100001â–²</tt>                            |
|   8 | a   |     `u/61` | <tt><b>61</b></tt>          | <tt>01â–²00001</tt>                            |
|   9 | b   |     `u/62` | <tt><b>62</b></tt>          | <tt>011000â–²0</tt>                            |
|  10 | c   |     `u/63` | <tt><b>63</b></tt>          | <tt>0110001â–²</tt>                            |
|  11 | ~   |     `u/7e` | <tt><b>7E</b></tt>          | <tt>011â–²1110</tt>                            |
|  12 | Ă¤   |     `u/e4` | <tt>C3 <b>A4</b></tt>       | <tt>11000011 â–²0100100</tt>                   |
|  13 | Ă¿   |     `u/ff` | <tt>C3 <b>BF</b></tt>       | <tt>11000011 001â–²1111</tt>                   |
|  14 | Î˜   |   `u/0398` | <tt><b>CE</b> 98</tt>       | <tt>1100â–²110 10011000</tt>                   |
|  15 | ä¸­  |   `u/4e2d` | <tt><b>E4</b> B8 AD</tt>    | <tt>11â–²00100 10111000 10101101</tt>          |
|  16 | đ €€   |  `u/20000` | <tt><b>F0</b> A0 80 80</tt> | <tt>111â–²0000 10100000 10000000 10000000</tt> |
|  17 | đ €?   |  `u/20001` | <tt>F0 A0 80 <b>81</b></tt> | <tt>11110000 10100000 10000000 1000000â–²</tt> |
|  18 | ô?¿½*  | `u/10fffd` | <tt><b>F4</b> 8F BF BD</tt> | <tt>11110â–²00 10001111 10111111 10111101</tt> |
|  19 | ï¿½*  |        ./. | <tt><b>FF</b></tt>          | <tt>1111â–²111</tt>                            |

> *Comments*â€”Shown in boldface are the UTF-8 bytes that cause one entry to be sorted after its predecessor;
> shown as `â–²` are the specific bits (of value `1`) that cause a key to be sorted after the previous one.
> As can be seen, sorting is done (in principle) by a
> pairwise comparison of the bits representing two given keys from left to right; as soon as there is a `1` in one
> key and a `0` in the other, the key with the `1` is sorted after the one with the `0`.
>
> Note that of the 19 entries shown here, the six keys coming after `Ă¿` represent the majority of the world's
> writing systems, including Greek, Cyrillic, Arabic, Ethiopic, Cherokee, Tifinagh, Georgian, Armenian,
> Chinese, Japanese, Korean, and so on ad libitum. Keys 2 thru 13 represent roughly 200 out of the 112'956
> printing codepoints defined in Unicode 7.0, that's 0.18%. Visit [the Unicode Slide Show](http://www.babelstone.co.uk/Unicode/unicode.html)
> to appreciate the dimensions: you'll spend less than a minute within the comfy equivalence of Latin-1, and
> the remaining *three hours* with the rest of the world.
>
> **(1)** symbolically using a character from the Unicode Command Pictures block; **(18)** the last
> legal codepoint of Unicode, located in the Supplementary Private Use Area B; appearance undefined; **(19)** as
> `0xff` is not (the start of) a legal UTF-8 sequence, this byte will cause a ï¿½ `u/fffd` Replacement
> Character to appear in the decoded output; some decoders may throw an error upon hitting such an illegal
> sequence.

1960's computing sure was cumbersome by today's standards; however, it was also simpler in many ways, not
least because the equivalence between a 'byte' (or other unit of fixed bit-length) and a 'character' (a unit
of written text, representing natural language, programming instructions or business data) could always be
relied upon. This equivalence so evident in the punched cards and teletype terminals used by ye old computer
shoppe in days of lore has been carried over and since become a deeply entrenched thinking-habit in the mind
of many a programmer, which sometimes leads to curious and fallacious results in software to this day.

The astute reader will need mere seconds to dig up the postings of some helpful soul who publicly recommends
to 'end your upper limit keys with a `Ă¿`', the reasoning apparently being that, since `Ă¿` is encoded as
`0xff` (in Latin-1) and `0xff` is the highest encodable byte-value, there can not be a key that comes after
that, for the Earth is flat and dragons be beyond the eighteth bit.

As the above table shows, this is wrong as soon as you ditch the (in NodeJS) poorly-supported legacy
encodings that Latin-1 / Latin-9 / CP1252 and like schemes have become and embrace, instead, the one
standard that is rightfully (in spite of any shortcomings that it possesses, too) considered 'The Standard'
in 2014â€”i.e. character repertoire Unicode / ISO 10646, encoded as UTF-8.


<!--

they swap in U+ffff to replace U+00ff

witness commit: https://github.com/mcollina/levelgraph/commit/cb081cd5cbb54e9294b114a028f857710282ba4f

if (i < 3) {  if (i < 3) {
- result += '::\xff';   + result += '::\uffff';
}   }

return result;  return result;
@@ -1217,8 +1217,8 @@ function createQuery(pattern, options) {
, key = genKey(index, pattern, '')  , key = genKey(index, pattern, '')
, limit = pattern.limit   , limit = pattern.limit
, reverse = pattern.reverse || false  , reverse = pattern.reverse || false
- , start = reverse ? key + '\xff' : key  + , start = reverse ? key + '\uffff' : key
- , end = reverse ? key : key + '\xff'  + , end = reverse ? key : key + '\uffff'
, query = {   , query = {
start: start  start: start
, end: end  , end: end




 -->


<!-- Worse still, one can often see `~` as a delimiter.

When using Unicode, the naĂ¯ve, old-fashioned way of constructing an upper limit by appending Latin-1 `Ă¿`
(`0xff`) to the key does *not* work in UTF-8.


100'000 printable codepoints; using `Ă¿` (`0xff`) encoded as `C3 BF` means that roughly 998â€° of all
printable codepoints are *not* caught
 -->

> "The lexicographic sorting order of UCS-4 strings is preserved."â€”[RFC 2044](https://www.ietf.org/rfc/rfc2044.txt)

<!--
CESU-8 and Binary DB Compatibility

Here we have to mention a somewhat thorny issue that is quite JavaScript-specific and a perennial source of
confusion and subtle bugs. The problems go back to the late 1980's and early 1990's, when Unicode was first
conceived and published. Back then, the decision was made to not create another [variable-width
encoding](http://en.wikipedia.org/wiki/Variable-width_encoding); rather, it was thought that going from
legacy 8bit encodings (that provides space for up to 156 characters) to a 16bit encoding with 65'536
positions would be big enough and future-proof. True, three bytes would have offerred a whopping 16'777'216
code points, but 3 is an awkward number when it comes to efficiently partition memory addresses. Four bytes
would have given us a Unicode with no less than 4'294'967'296 codepoints, which nobody could imagine to be
ever necessary for a character encoding scheme. Anyway, Unicode came under fire for being inefficient and
wasteful for requiring a full 16 bits for each letter, each digit and each punctuation mark, so anything
beyond 16 bits was out of question as it would have impaired Unicode's chances to ever gain wide adoption.

Now it soon became evident that 65'536 codepoints was in fact little if you really wanted to encode *all* of
the world's scripts, ancient and modern, widely used and obscure. Whether or not to include characters from
such a wide range of sources was a matter of debate for some years, some members of the consortium putting
forth the proposition that only 'commercially viable scripts in daily use in the present world' should be
elligble for encoding.

Fortunately, this narrow view did not prevail, and today, there are around 75'000 Chinese characters and
over 10'000 Hangeul syllables encoded in Unicode. These alone exceed the limit set by a 16bit encoding, so a
solution was needed. The Unicode consortium was still shy to break the 16bit barrier, as it was felt that it
would break too much existing software at the time, again hampering the projects rate of adoption; also,
spending *four* bytes on *each* character was in fact rather wasteful terms of both transmission times and
storage volumes.

The Gordian knot was untied with the introduction of so-called 'surrogate pairs'. These were reserved
the existing

 -->

### X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X

The buffers that we obtained in the previous step are somewhat hard to visualize
in a readable mannerâ€”we can either list the value of all the bytes in
hexadecimal, or try to print out the buffers as strings. Unfortunately, it turns
out that for [historical reasons](http://en.wikipedia.org/wiki/ASCII), many
Unicode code positions in the range `[ 0x00 .. 0xff ]` do not define 'printable'
but rather 'control' characters such as newlines, tabulators and what not, and
actually, the code points in the range `[ 0x80 .. 0x9f ]` do not even have
specified jobsâ€”they're defined as 'generic control' characters that are, in
practice, nothing but unusable gaps in the code table.

When a text is encoded as UTF-8â€”which is basically what H2C and JSON doâ€”then
only characters between `0x00` and `0x7f` are preserved in a one-to-one fashion;
all other characters are turned into sequences of between 2 and 3 bytes, not all
of which correspond to 'nice' Unicode characters.

For this reason, we have here adopted a customary encoding that preserves most
printable Unicode codepoints in the range `[ 0x00 .. 0xff ]` and adds a few
symbolic printable characters to make the output more readily interpretable. In
detail:

* `âˆ‡` (`0x00`) symbolizes the zero byte;
* `â‰¡` (`0x01 .. 0x1f`) symbolizes all 'unprintable' control characters;
* `â?£` (`0x20`) symbolizes the space character;
* `âˆƒ` (`0x08 .. 0x9f`) symbolizes code points that occur as follow-up bytes
  in UTF-8 byte sequences which do not have an printable representation in Unicode;
* `â‰¢` (`0xa0`, `0xa1`, `0xf3 .. 0xfe`) symbolizes code points that can not occur
  in a weel-formed UTF-8 byte sequence;
* `Î”` (`0xff`) symbolizes the highest byte.

Thus, our code table looks like this:

```
     0123456789abcdef 0123456789abcdef
0x00 âˆ‡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡ â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡â‰¡ 0x10
0x20 â?£!"#$%&'()*+,-./ 0123456789:;<=>? 0x30
0x40 @ABCDEFGHIJKLMNO PQRSTUVWXYZ[\]^_ 0x50
0x60 `abcdefghijklmno pqrstuvwxyz{|}~â‰¡ 0x70
0x80 âˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒ âˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒâˆƒ 0x90
0xa0 âˆƒâˆƒÂ¢Â£Â¤Â¥Â¦Â§Â¨Â©ÂªÂ«Â¬Đ¯Â®Â¯ Â°Â±Â²Â³Â´ÂµÂ¶Â·Â¸Â¹ÂºÂ»Â¼Â½Â¾Â¿ 0xb0
0xc0 Ă€Ă?Ă‚ĂƒĂ„Ă…Ă†Ă‡ĂˆĂ‰Ă?Ă‹ĂŒĂ?Ă?Ă? Ă?Ă‘Ă’Ă“Ă”Ă•Ă–Ă—Ă˜Ă™Ă?Ă›ĂœĂ?Ă?ĂŸ 0xd0
0xe0 Ă Ă¡Ă¢Ă£Ă¤Ă¥Ă¦Ă§Ă¨Ă©ĂªĂ«Ă¬Ă­Ă®Ă¯ Ă°Ă±Ă²â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢â‰¢Î” 0xf0
```

Let's try out this encoding so we learn how to interpret the below
illustrations. First, let's encode a string `'abcĂ¤Ă¶Ă¼'` in UTF-8 and look at the
result: `b = new Buffer 'abcĂ¤Ă¶Ă¼'` gives us `<Buffer 61 62 63 c3 a4 c3 b6 c3
bc>`, the usual representation of a `Buffer` instance in the NodeJS REPL. Of
course. `b.toString 'utf-8'` would give us back the original string, but
decoding the same using `latin-1` (properly called ISO/IEC 8859-1)â€”which is an
8bit encodingâ€”gives us one printable character per byte: `'abcĂƒÂ¤ĂƒÂ¶ĂƒÂ¼'`.

Things turn worse when doing the same with the string `'ä¸€xä¸?xä¸‚'`. The buffer is
logged as `<Buffer e4 b8 80 78 e4 b8 81 78 e4 b8 82>`, which turns into
something like `'Ă¤Â¸â–“xĂ¤Â¸â–“xĂ¤Â¸â–“'` when decoded as `latin-1`. What you'll actually
see in place of those `â–“` boxes depends; in my console, i get a space for the
first two and something looking like a comma for the last box, but when i copy
that into my text editor, the boxes all turn into zero-width spaces, and when i
publish a text containing those characters to GitHub, i get `ï¿½` in the browser.
This is truly confusing and not helpful. In our custom encoding, the bytes used
to encode `'ä¸€xä¸?xä¸‚'` are rendered as `Ă¤Â¸âˆƒxĂ¤Â¸âˆƒxĂ¤Â¸âˆƒ`, where `âˆƒ` represents three
(further undifferentiated) UTF-8 sequence continuation bytes.

Now let's take a look at the H2C encoding: Calling `HOLLERITH.CODEC.encode [
'abc', 'def', ]` gives us `<Buffer 54 61 62 63 00 54 64 65 66 00>`, which may be
rendered as `Tabcâˆ‡Tdefâˆ‡`. The `T`s indicate the start of strings, while the
`âˆ‡`sâ€”which symbolize `0x00` bytesâ€”signal the end of strings; hence, our input
value contined two strings, encoded as `T...âˆ‡T...âˆ‡`. Using `[ 'xxx', 42, ]` as
input, we get `<Buffer 54 78 78 78 00 4c 40 45 00 00 00 00 00 00>`, which is
visualized as `Txxxâˆ‡L@Eâˆ‡âˆ‡âˆ‡âˆ‡âˆ‡âˆ‡`. Here, `...âˆ‡L...` shows the end of a string as
`âˆ‡` and the start of a positive finite number as `L`; the ensuing eight bytes
`@Eâˆ‡âˆ‡âˆ‡âˆ‡âˆ‡âˆ‡` (which are mostly zero) encode the numerical value of `42` according
to IEEE-754. FInally, `[ true, -1 / 7, ]` is encoded as `<Buffer 44 4b c0 3d b6
db 6d b6 db 6d>`, which corresponds to `DKĂ€=Â¶Ă›mÂ¶Ă›m` (`D` encodes `true`, and `K`
signals a negative finite number).



## The Hollerith2 Phrase Structure

![](https://github.com/loveencounterflow/hollerith/raw/master/art/082.jpg)

<!-- If you've read [the section on H2C](#the-hollerith2-codec-h2c) you might have
noticed the restriction on DB facets mentioned there: While DB facet *values*
are encoded as JSON and can, therefore, hold any value that is acceptable to
`JSON.stringify()`, facet *keys* are encoded using the HollerithÂ² Codec, which
accepts only flat (unnested) lists of numbers, texts, dates, or `null`, `false`,
`true`. In this section, we will motivate why that is a good thing and how
building an indexed, structured data collection is intended to work with
Hollerith.

### SPO and POS
 -->

The HollerithÂ² data model may be characterized as a 'binary phrase database with
transparent total indexing'. Let's take that apart for once.

The term 'phrase' points out that facts are recorded in a format akin to phrases
or sentences used in natural language. In spoken language, we distinguish the
major roles of sentences as *subject* (that which is spoken about), *predicate*
(the topic of the sentence, as it were), and *object* (what is being said about
the subject). That may or may not be a linguistically correct explanation, but
it's one that will serve us well for our purposes.

With 'binary phrase database' I mean that facts are recorded in two waysâ€”once as
a primary, main entry and once as a secondary, index entry; 'transparent total
indexing' points out that this happens automatically and for all the fact
phrases you enter into the DB.

Let's clarify that by way of example.

> The motivation to write HollerithÂ² comes from the desire to record and process
> facts about [Chinese characters (a.k.a. Kanji in Japanese and Hanja in
> Korean)](http://en.wikipedia.org/wiki/Chinese_characters), of which there are
> many thousands encoded in Unicode, so our examples will draw from that data
> collection. No example here is contrived; I will try and use only such
> examples that are intelligible to people who are not acquainted with
> East-Asian languages.

Something very obvious that can be said about Chinese characters is that they
vary greatly in terms of visual complexity: for example, among the very common
characters ä¸?, ä¸‰, å¤«, åœ‹, å½¢ the characters ä¸? and ä¸‰ are vastly easier to read and
write than åœ‹, while å½¢ is somewhere in the middle.

One way to capture this difference in complexity is to simply count the strokes
needed to write a given character. We find that ä¸?, ä¸‰, å¤«, åœ‹, and å½¢ are written
using 2, 3, 5, 11, and 7 strokes, respectively.

Another way to account for percevived complexity is to count from how many
indivual parts a character is composedâ€”a more promising approach, but also a
much more contentious one, as it is often quite difficult to clearly delineate
parts of characters in an unequivocal fashion. Be that as it may, in my book åœ‹
is analyzed as å›—æˆˆå?£ä¸€ and å½¢ as å¼€å½¡, while ä¸?, ä¸‰, and å¤« are counted as single
components.

Using Hollerith phrases, we can tentatively record these finds as follows:

```
subject     predicate                     object
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
ä¸?          strokecount                    2
ä¸‰          strokecount                    3
å¤«          strokecount                    5
åœ‹          strokecount                    11
å½¢          strokecount                    7
â”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆ
ä¸?          componentcount                 1
ä¸‰          componentcount                 1
å¤«          componentcount                 1
åœ‹          componentcount                 4
å½¢          componentcount                 2
â”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆâ”ˆ
ä¸?          components                     [ ä¸?, ]
ä¸‰          components                     [ ä¸‰, ]
å¤«          components                     [ å¤«, ]
åœ‹          components                     [ å›—, æˆˆ, å?£, ä¸€, ]
å½¢          components                     [ å¼€, å½¡, ]

```

The entries can be readily read out as `å¤«` (has a) `strokecount` (of) `5` and so
on. These phrases will become our mainstay entries. In order to record them,
each fact is bundled into a triplet `[ S(ubject), P(redicate), O(bject), ]` and
sent to the database engine. At this point in time, the relative ordering of the
phrases is irrelevant, as they will transparently become ordered upon
insertion:

```
[ 'ä¸?', 'strokecount',     2,                          ]
[ 'ä¸‰', 'strokecount',     3,                          ]
[ 'å¤«', 'strokecount',     5,                          ]
[ 'åœ‹', 'strokecount',     11,                         ]
[ 'å½¢', 'strokecount',     7,                          ]
[ 'ä¸?', 'componentcount',  1,                          ]
[ 'ä¸‰', 'componentcount',  1,                          ]
[ 'å¤«', 'componentcount',  1,                          ]
[ 'åœ‹', 'componentcount',  4,                          ]
[ 'å½¢', 'componentcount',  2,                          ]
[ 'ä¸?', 'components',      [ 'ä¸?', ],                  ]
[ 'ä¸‰', 'components',      [ 'ä¸‰', ],                  ]
[ 'å¤«', 'components',      [ 'å¤«', ],                  ]
[ 'åœ‹', 'components',      [ 'å›—', 'æˆˆ', 'å?£', 'ä¸€', ], ]
[ 'å½¢', 'components',      [ 'å¼€', 'å½¡', ],             ]
```

Hollerith will then do a couple things: first, it will split each phrase into a
key and a value part, with the keys comprising both the subject and the
predicate of each phrase while the objects become the values of the key / value
pairs (a.k.a. 'facets'):

```
key                             value
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
[ 'ä¸?', 'strokecount',    ]  â”?  2
[ 'ä¸‰', 'strokecount',    ]  â”?  3
[ 'å¤«', 'strokecount',    ]  â”?  5
[ 'åœ‹', 'strokecount',    ]  â”?  11
[ 'å½¢', 'strokecount',    ]  â”?  7
[ 'ä¸?', 'componentcount', ]  â”?  1
[ 'ä¸‰', 'componentcount', ]  â”?  1
[ 'å¤«', 'componentcount', ]  â”?  1
[ 'åœ‹', 'componentcount', ]  â”?  4
[ 'å½¢', 'componentcount', ]  â”?  2
[ 'ä¸?', 'components',     ]  â”?  [ 'ä¸?', ]
[ 'ä¸‰', 'components',     ]  â”?  [ 'ä¸‰', ]
[ 'å¤«', 'components',     ]  â”?  [ 'å¤«', ]
[ 'åœ‹', 'components',     ]  â”?  [ 'å›—', 'æˆˆ', 'å?£', 'ä¸€', ]
[ 'å½¢', 'components',     ]  â”?  [ 'å¼€', 'å½¡', ]
```

Next, a so-called phrasetype marker is prepended to each key. As there are
primary and secondary phrases in Hollerith, there are two matching phrasetype
markers as well, `'spo'` (for Subjectâ€”Predicateâ€”Object) and `'pos'` (for
Predicateâ€”Objectâ€”Subject). We will first confine ourselves to the primary type
marked `'spo'`, and this is what they look like now:

```
key                                   value
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
[ 'spo', 'ä¸?', 'strokecount',    ] â”?  2
[ 'spo', 'ä¸‰', 'strokecount',    ] â”?  3
[ 'spo', 'å¤«', 'strokecount',    ] â”?  5
...
```

At this point the keys are encoded using the H2C codec, and the values with what
comes down to `new Buffer ( JSON.stringify value ), 'utf-8'`, that is, the
result of `JSON.stringify` encoded in UTF-8. We are left with two buffers per
entry, which are written to the store just as if you had called `db = level
'route/to/db'; db.put key, value` directly.

X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X
X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X X

With that preparation, it becomes sort of easy to parse the below display which
shows how our sample data about some Chinese characters are stored in a LevelDB
instance. On the top we have the hexadecimal values of the bytes stored, and
below that the readable representations of those byte sequences in our custom
encoding:


```
key                                                                             value
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
54 73 70 6f 00 54 e4 b8 81 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 32
54 73 70 6f 00 54 e4 b8 89 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 33
54 73 70 6f 00 54 e5 a4 ab 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 35
54 73 70 6f 00 54 e5 9c 8b 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 31 31
54 73 70 6f 00 54 e5 bd a2 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 37
54 73 70 6f 00 54 e4 b8 81 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 31
54 73 70 6f 00 54 e4 b8 89 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 31
54 73 70 6f 00 54 e5 a4 ab 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 31
54 73 70 6f 00 54 e5 9c 8b 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 34
54 73 70 6f 00 54 e5 bd a2 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 32
54 73 70 6f 00 54 e4 b8 81 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e4 b8 81 22 5d
54 73 70 6f 00 54 e4 b8 89 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e4 b8 89 22 5d
54 73 70 6f 00 54 e5 a4 ab 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e5 a4 ab 22 5d
54 73 70 6f 00 54 e5 9c 8b 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e5 9b 97 22 2c 22 e6 88 88 22 2c 22 e5 8f a3 22 2c 22 e4 b8 80 22 5d
54 73 70 6f 00 54 e5 bd a2 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e5 bc 80 22 2c 22 e5 bd a1 22 5d
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
TspoTĂ¤Â¸âˆƒâˆ‡Tstrokecountâˆ‡     â”? 2
TspoTĂ¤Â¸âˆƒâˆ‡Tstrokecountâˆ‡     â”? 3
TspoTĂ¥Â¤Â«âˆ‡Tstrokecountâˆ‡     â”? 5
TspoTĂ¥âˆƒâˆƒâˆ‡Tstrokecountâˆ‡     â”? 11
TspoTĂ¥Â½Â¢âˆ‡Tstrokecountâˆ‡     â”? 7
TspoTĂ¤Â¸âˆƒâˆ‡Tcomponentcountâˆ‡  â”? 1
TspoTĂ¤Â¸âˆƒâˆ‡Tcomponentcountâˆ‡  â”? 1
TspoTĂ¥Â¤Â«âˆ‡Tcomponentcountâˆ‡  â”? 1
TspoTĂ¥âˆƒâˆƒâˆ‡Tcomponentcountâˆ‡  â”? 4
TspoTĂ¥Â½Â¢âˆ‡Tcomponentcountâˆ‡  â”? 2
TspoTĂ¤Â¸âˆƒâˆ‡Tcomponentsâˆ‡      â”? ["Ă¤Â¸âˆƒ"]
TspoTĂ¤Â¸âˆƒâˆ‡Tcomponentsâˆ‡      â”? ["Ă¤Â¸âˆƒ"]
TspoTĂ¥Â¤Â«âˆ‡Tcomponentsâˆ‡      â”? ["Ă¥Â¤Â«"]
TspoTĂ¥âˆƒâˆƒâˆ‡Tcomponentsâˆ‡      â”? ["Ă¥âˆƒâˆƒ","Ă¦âˆƒâˆƒ","Ă¥âˆƒÂ£","Ă¤Â¸âˆƒ"]
TspoTĂ¥Â½Â¢âˆ‡Tcomponentsâˆ‡      â”? ["Ă¥Â¼âˆƒ","Ă¥Â½âˆƒ"]
```

We can see at a glance that while this is how Hollerith *encodes* data, it isn't
quite how LevelDB will *store* it, as it always keeps all key lexicographically
ordered. No matter whatever which way you happened to send your keys to the DB,
when you read them out again, they will come up in this order:

```
key                                                                             value
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
54 73 70 6f 00 54 e4 b8 81 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 31
54 73 70 6f 00 54 e4 b8 81 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e4 b8 81 22 5d
54 73 70 6f 00 54 e4 b8 81 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 32
54 73 70 6f 00 54 e4 b8 89 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 31
54 73 70 6f 00 54 e4 b8 89 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e4 b8 89 22 5d
54 73 70 6f 00 54 e4 b8 89 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 33
54 73 70 6f 00 54 e5 9c 8b 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 34
54 73 70 6f 00 54 e5 9c 8b 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e5 9b 97 22 2c 22 e6 88 88 22 2c 22 e5 8f a3 22 2c 22 e4 b8 80 22 5d
54 73 70 6f 00 54 e5 9c 8b 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 31 31
54 73 70 6f 00 54 e5 a4 ab 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 31
54 73 70 6f 00 54 e5 a4 ab 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e5 a4 ab 22 5d
54 73 70 6f 00 54 e5 a4 ab 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 35
54 73 70 6f 00 54 e5 bd a2 00 54 63 6f 6d 70 6f 6e 65 6e 74 63 6f 75 6e 74 00 â”? 32
54 73 70 6f 00 54 e5 bd a2 00 54 63 6f 6d 70 6f 6e 65 6e 74 73 00             â”? 5b 22 e5 bc 80 22 2c 22 e5 bd a1 22 5d
54 73 70 6f 00 54 e5 bd a2 00 54 73 74 72 6f 6b 65 63 6f 75 6e 74 00          â”? 37
â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?â”?
Tspoâˆ‡TĂ¤Â¸âˆƒâˆ‡Tcomponentcountâˆ‡           â”? 1
Tspoâˆ‡TĂ¤Â¸âˆƒâˆ‡Tcomponentsâˆ‡               â”? ["Ă¤Â¸âˆƒ"]
Tspoâˆ‡TĂ¤Â¸âˆƒâˆ‡Tstrokecountâˆ‡              â”? 2
Tspoâˆ‡TĂ¤Â¸âˆƒâˆ‡Tcomponentcountâˆ‡           â”? 1
Tspoâˆ‡TĂ¤Â¸âˆƒâˆ‡Tcomponentsâˆ‡               â”? ["Ă¤Â¸âˆƒ"]
Tspoâˆ‡TĂ¤Â¸âˆƒâˆ‡Tstrokecountâˆ‡              â”? 3
Tspoâˆ‡TĂ¥âˆƒâˆƒâˆ‡Tcomponentcountâˆ‡           â”? 4
Tspoâˆ‡TĂ¥âˆƒâˆƒâˆ‡Tcomponentsâˆ‡               â”? ["Ă¥âˆƒâˆƒ","Ă¦âˆƒâˆƒ","Ă¥âˆƒÂ£","Ă¤Â¸âˆƒ"]
Tspoâˆ‡TĂ¥âˆƒâˆƒâˆ‡Tstrokecountâˆ‡              â”? 11
Tspoâˆ‡TĂ¥Â¤Â«âˆ‡Tcomponentcountâˆ‡           â”? 1
Tspoâˆ‡TĂ¥Â¤Â«âˆ‡Tcomponentsâˆ‡               â”? ["Ă¥Â¤Â«"]
Tspoâˆ‡TĂ¥Â¤Â«âˆ‡Tstrokecountâˆ‡              â”? 5
Tspoâˆ‡TĂ¥Â½Â¢âˆ‡Tcomponentcountâˆ‡           â”? 2
Tspoâˆ‡TĂ¥Â½Â¢âˆ‡Tcomponentsâˆ‡               â”? ["Ă¥Â¼âˆƒ","Ă¥Â½âˆƒ"]
Tspoâˆ‡TĂ¥Â½Â¢âˆ‡Tstrokecountâˆ‡              â”? 7
```

# Practice

## Inserting Data

```
  #.........................................................................................................
  step ( resume ) =>
    yield @_feed_test_data db, probes_idx, resume
    prefix    = [ 'pos', 'guide', ]
    input     = HOLLERITH.create_phrasestream db, prefix, '*'
    debug 'Â©FphJK', input[ '%meta' ]
    settings  = { indexed: no, }
    input
      .pipe $ ( phrase, send ) =>
        count  += +1
        idx    += +1
        debug 'Â©Sc5FG', phrase
        # T.eq phrase, matchers[ idx ]
      .pipe D.$on_end =>
        T.eq count, matchers.length
        done()
```

## Indexing Data

There is a somewhat surprising, maybe puzzling, but nonetheless rather simple
way to build indexes with Hollerith, using nothing but what the Hollerith Codec
brings to the table anywayâ€”lists of values.

Let's say you had two kinds of data about Chinese characters: what they're read like
(using a simplified, non-tonal Pinyin transcription), and what other characters a
given character looks similar to. We can capture this knowledge in two sets
of phrases; the first captures the pronunciations *qian* for å?ƒ, *yu* for
äº?, and *gan* for å¹²; for good measure, I've thrown in another data point for äºº:

```coffee
# Subject    Predicate          Object(s)
[ [ 'å?ƒ', ], 'reading/py/base', [ 'qian', ], ]
[ [ 'äº?', ], 'reading/py/base', [ 'yu',   ], ]
[ [ 'å¹²', ], 'reading/py/base', [ 'gan',  ], ]
[ [ 'äºº', ], 'reading/py/base', [ 'ren',  ], ]
```

In these phrases, the object is a list of values because each character may have a
number of readings (two or three being not uncommon); I've chosen to use a sub-list
for the subject, too, for reasons that will become clear momentarily.

In the second set of phrases, we record our sentiment that å?ƒ, äº? and å¹² happen to
look alike (but unlike äºº). Of course, a given character always 'looks like'
itself; if we don't want to pollute the DB with that kind of triviality, we'll
end up with three phrases to capture that å?ƒ is similar to äº?å¹², äº? is similar to
å¹²å?ƒ, and å¹² is similar to å?ƒäº?:

```coffee
# Subject    Predicate          Object(s)
[ [ 'å?ƒ', ], 'shape/similarity', [ 'äº?', 'å¹²', ], ]
[ [ 'äº?', ], 'shape/similarity', [ 'å¹²', 'å?ƒ', ], ]
[ [ 'å¹²', ], 'shape/similarity', [ 'å?ƒ', 'äº?', ], ]
```

The above 3 + 4 = 7 net (SPO) phrases expand to 7 (SPO) + 10 (POS) = 17 gross
(SPO and POS) phrases in the DB, a dump of which is shown here in the actual
lexicographic order:

```coffee
#        Predicate           Object(s)            Subject
[ 'pos', 'reading/py/base',  'gan',               [ 'å¹²', ], 0, ]
[ 'pos', 'reading/py/base',  'qian',              [ 'å?ƒ', ], 0, ]
[ 'pos', 'reading/py/base',  'ren',               [ 'äºº', ], 0, ]
[ 'pos', 'reading/py/base',  'yu',                [ 'äº?', ], 0, ]
[ 'pos', 'shape/similarity', 'äº?',                 [ 'å?ƒ', ], 0, ]
[ 'pos', 'shape/similarity', 'äº?',                 [ 'å¹²', ], 1, ]
[ 'pos', 'shape/similarity', 'å?ƒ',                 [ 'äº?', ], 1, ]
[ 'pos', 'shape/similarity', 'å?ƒ',                 [ 'å¹²', ], 0, ]
[ 'pos', 'shape/similarity', 'å¹²',                 [ 'äº?', ], 0, ]
[ 'pos', 'shape/similarity', 'å¹²',                 [ 'å?ƒ', ], 1, ]
#        Subject             Predicate             Object(s)
[ 'spo', [ 'äº?', ],          'reading/py/base',    [ 'yu',      ], ]
[ 'spo', [ 'äº?', ],          'shape/similarity',   [ 'å¹²','å?ƒ',  ], ]
[ 'spo', [ 'äºº', ],          'reading/py/base',    [ 'ren',     ], ]
[ 'spo', [ 'å?ƒ', ],          'reading/py/base',    [ 'qian',    ], ]
[ 'spo', [ 'å?ƒ', ],          'shape/similarity',   [ 'äº?','å¹²',  ], ]
[ 'spo', [ 'å¹²', ],          'reading/py/base',    [ 'gan',     ], ]
[ 'spo', [ 'å¹²', ],          'shape/similarity',   [ 'å?ƒ','äº?',  ], ]
```

At this point we can already iterate over phrases that start with `[ 'pos',
'reading/py/base', ...` to obtain just the ordering we want for a Pinyin-based
dictionary.

> **Note** that the reason for *gan*, *qian*, *ren*, *yu* to appear in the
> correct alphabetic order is ultimately rooted in the fact that the inventors
> of US ASCII chose to encode these letters in the way they did; when you throw
> in the accented letters needed to write tonal Pinyin (or words from any
> language with letters outside of `[a-z]`), that property is, in general, lost:
> the accented letters needed for Pinyin sort lexicographically as
> `aeiouĂ Ă¡Ă¨Ă©Ă¬Ă­Ă²Ă³Ă¹ĂºĂ¼Ä?Ä“Ä›Ä«Å?Å«Ç?Ç?Ç’Ç”Ç–Ç˜Ç?Çœ`, which is probably not what you want.
> Coming to think of it, it *might* be a good idea to implement locale- or
> use-case specific encodings for strings to Hollerith.

Now if we wanted to build a dictionary with characters ordered by Pinyin that
cross-references similar characters, one approach would be to iterate over those
phrases that start with `[ 'pos', 'reading/py/base', ...`, retrieve the subject
character from each phrase, and retrieve the phrase (if any) that has the prefix
`[ 'spo', [ glyph, ], 'shape/similarity', ...`.

Doing intermittent requests is possible, but it also necessitates interrupting
the main stream (no pun) of entries with (potentially lots of) intermittent
retrievals, one for each character and each of the maybe many tidbits of data
we have in store for it. Building index allows us to do that data aggregation
part upfront and have the precooked data in all the right places read for
consumption. That way, the database will grow bigger (and maybe contain more
duplicate data), but it will also be much easier to walk over entries that are
to appear in the resulting product.

And here's how to do that, in four easy steps (there's a fifth one, for which see below):

**â‘ ** The original phrase (call it OP); subject has been made a list already:

```coffee
# Subject      Predicate           Object
[ [ 'äº?', ],   'shape/similarity', [ 'å¹²', 'å?ƒ', ] ]
```

**â‘¡** Move predicate and object into the subject...

```coffee
# Subject
# Sub-Subject  Sub-Predicate       Sub-Object
[ [ 'äº?',      'shape/similarity', [ 'å¹²', 'å?ƒ', ], ] ]
```

**â‘¢** ...and (optionally) 'singularize' the object in case it is a list. This
is interesting if you want to have those entries to appear in a specific order:

```coffee
[ [ 'äº?',      'shape/similarity', 'å¹²', ] ]
[ [ 'äº?',      'shape/similarity', 'å?ƒ', ] ]
```

**â‘£** Now add the predicate and object that you want the OP to appear below when
dumping POS (Predicateâ€”Objectâ€”Subject) phrases:

```coffee
# Subject                                     Predicate           Object
# Sub-Subject  Sub-Predicate       Sub-Object
[ [ 'äº?',      'shape/similarity', 'å¹²', ],    'reading/py/base', 'yu', ]
[ [ 'äº?',      'shape/similarity', 'å?ƒ', ],    'reading/py/base', 'yu', ]
```

Here's a complete dump of our small database so far; the SPO phrases are greyed
out to highlight the part where the action is going on: When we iterate over
all phrases that start with the prefix `[ 'pos', 'reading/py/base', ...`, we'll
get to see the three head entries for our three characters *gan* å¹², *qian* å?ƒ,
*yu* äº?, in the order of their readings; in between each character and the
beginning of the next head entry are sandwiched secondary entries with additional
data:

```coffee
  [ 'pos', 'reading/py/base', 'gan',  [ 'å¹²',                           ], 0, ]
  [ 'pos', 'reading/py/base', 'gan',  [ 'å¹²', 'shape/similarity', 'äº?', ],    ]
  [ 'pos', 'reading/py/base', 'gan',  [ 'å¹²', 'shape/similarity', 'å?ƒ', ],    ]
  [ 'pos', 'reading/py/base', 'qian', [ 'å?ƒ',                           ], 0, ]
  [ 'pos', 'reading/py/base', 'qian', [ 'å?ƒ', 'shape/similarity', 'äº?', ],    ]
  [ 'pos', 'reading/py/base', 'qian', [ 'å?ƒ', 'shape/similarity', 'å¹²', ],    ]
  [ 'pos', 'reading/py/base', 'yu',   [ 'äº?',                           ], 0, ]
  [ 'pos', 'reading/py/base', 'yu',   [ 'äº?', 'shape/similarity', 'å?ƒ', ],    ]
  [ 'pos', 'reading/py/base', 'yu',   [ 'äº?', 'shape/similarity', 'å¹²', ],    ]
# [ 'spo', [ 'äº?',                            ], 'reading/py/base', [ 'yu',   ], ]
# [ 'spo', [ 'äº?', 'shape/similarity',  'å?ƒ', ], 'reading/py/base',   'yu',   ]
# [ 'spo', [ 'äº?', 'shape/similarity',  'å¹²', ], 'reading/py/base',   'yu',   ]
# [ 'spo', [ 'å?ƒ',                            ], 'reading/py/base', [ 'qian', ], ]
# [ 'spo', [ 'å?ƒ', 'shape/similarity',  'äº?', ], 'reading/py/base',   'qian', ]
# [ 'spo', [ 'å?ƒ', 'shape/similarity',  'å¹²', ], 'reading/py/base',   'qian', ]
# [ 'spo', [ 'å¹²',                            ], 'reading/py/base', [ 'gan',  ], ]
# [ 'spo', [ 'å¹²', 'shape/similarity',  'äº?', ], 'reading/py/base',    'gan',  ]
# [ 'spo', [ 'å¹²', 'shape/similarity',  'å?ƒ', ], 'reading/py/base',    'gan',  ]
```

We can also now appreciate why it was a good idea to turn the subjects of our
main entry phrases into single-element lists: the  [H2C codec](#the-hollerith2
-codec-h2c) orders by type first, then by values, and all lists are sorted
before any strings. Therefore, plain phrases  with strings as subjects like `[
's', 'p', 'o', ]` will come only *after* any index phrases  `[ [ 's', 'sp',
'so', ], 'p', 'o', ]`, which is not what we want.

> As a side-effect, subjects-as-lists open up a straightforward avenue to putting
> type information into the subject. We can now be more specific and write, say,
> `[ 'character', 'å¹²', ]` for the subject.

<!--
> Observe that with this addition, the
> phrase subject now looks like a predicate / object pair, i.e. we could
> re-conceptualize phrases as `[ s, o, ]` pairs with `s = [ sp, so, ]` and
> `o = [ op, oo, ]`
 -->

We are, alas, not quite yet ready at this point. Our DB contains three
characters with one reading  each. We've chosen to use lists of strings to
record readings for a reason, because there are many characters that have a
number of readings that have to be chosen according to context; for example, èª¬
is normally read *shuo* 'to say', but èª¬æœ? 'to convince' is (often) read
*shuifu*. I didn't think of this when I started to piece together this
example, so let's just add a bogus reading `'foo'` to one of our sample
characters and see what happens. This is the data we start with:

```coffee
# Subject    Predicate          Object(s)
[ [ 'å¹²', ], 'reading/py/base',  [ 'gan', 'foo', ], ]
[ [ 'å¹²', ], 'shape/similarity', [ 'å?ƒ',  'äº?',   ], ]
```


## Deleting Data
## Reading Data

### @create_phrasestream = ( db, lo_hint = null, hi_hint = null ) ->
### @create_facetstream = ( db, lo_hint = null, hi_hint = null ) ->
### @read_sub = ( db, settings, read ) ->


## Plans for v4

exp

* Both SPO and POS phrases will be stored in the LevelDB key; the LevelDB value
  is not used, turning a Hollerith DB into a 'keys-only' store.

* Phrase structure will be a bit more specific; we encourage the use of typed subjects
  and objects, as in `[ [ 'glyph', 'æœˆ', ], 'reading', [ 'zh:py/bare', 'yue', ] ]`.

* Since entire phrases like `[ [ 'glyph', 'æœˆ', ], 'reading', [ 'zh:py/bare', 'yue', ] ]`
  will be stored in the key, retrieving what reading a given glyph has cannot
  be done by using the LevelDB `get` operation; instead, `get` is implmented internally
  by iterating over a prefix stream that contains all keys that match
  ``[ [ 'glyph', 'æœˆ', ], 'reading', ...`.

* With phrases-as-keys, it becomes possible to store any number of facts about
  a given subject / predicate pair as long as objects are distinct, without having
  to use an index. Without an index, object values will be retrieved in lexicographic
  order; to implement repeated objects and / or a
  specific ordering other than lexicographic, an explicit index between predicate
  and object or between object type and object value may be inserted:

```coffee
[ [ 'glyph', 'é‡?', ], 'reading', 0, [ 'zh:py/bare', 'zhong', ] ]
[ [ 'glyph', 'é‡?', ], 'reading', 1, [ 'zh:py/bare', 'chong', ] ]

[ [ 'glyph', 'é‡?', ], 'reading', [ 'zh:py/bare', 0, 'zhong', ] ]
[ [ 'glyph', 'é‡?', ], 'reading', [ 'zh:py/bare', 1, 'chong', ] ]
```

* Indexing phrases will not be stored in SPO form anymore.

<!--

```
so|glyph:å­—|gloss:letter, character, word|o:0
Â·Â·Â·Â·Â·Â·Â·Â·Â·â—?â—?â—?Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·Â·
â—?â—?â—?â—?â—?â—?â—?â—?Â·â—?Â·Â·â—?â—?â—?â—?â—?â—?Â·â—?â—?â—?â—?â—?â—?Â·Â·â—?â—?â—?â—?â—?â—?â—?â—?â—?Â·Â·â—?â—?â—?â—?â—?â—?Â·Â·
â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?Â·â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?â—?
â—?Â·â—?Â·Â·â—?â—?Â·â—?Â·Â·â—?â—?Â·Â·Â·â—?â—?â—?Â·Â·â—?â—?Â·â—?Â·Â·Â·Â·Â·â—?Â·Â·â—?Â·â—?Â·Â·â—?Â·â—?Â·â—?Â·â—?â—?
Â·â—?â—?Â·â—?â—?Â·â—?â—?Â·â—?Â·â—?Â·â—?â—?Â·Â·â—?â—?Â·Â·Â·Â·Â·â—?Â·Â·â—?Â·Â·Â·Â·Â·Â·Â·â—?Â·Â·â—?Â·Â·â—?â—?â—?Â·
Â·â—?â—?â—?â—?Â·Â·Â·Â·â—?â—?â—?â—?â—?â—?â—?Â·Â·Â·â—?â—?â—?â—?â—?Â·â—?Â·Â·Â·Â·Â·Â·Â·â—?â—?Â·â—?Â·â—?â—?Â·â—?â—?â—?Â·Â·
â—?â—?Â·â—?Â·Â·Â·Â·â—?Â·Â·â—?Â·â—?Â·â—?â—?â—?â—?Â·Â·Â·Â·Â·â—?Â·Â·â—?Â·Â·â—?Â·â—?Â·Â·â—?Â·Â·â—?â—?â—?Â·Â·â—?â—?Â·
â—?â—?Â·â—?Â·â—?Â·Â·Â·â—?â—?â—?Â·â—?Â·â—?â—?â—?Â·Â·â—?Â·Â·â—?Â·Â·Â·â—?Â·â—?Â·â—?â—?Â·â—?Â·Â·Â·â—?â—?Â·Â·Â·â—?Â·Â·
```


```
phrasetype  | subject         | object                  | index
            | theme : topic   | predicate : complement  | idx [ , idx ... ]
pt          | sk    : sv      | ok        : ov          | idx [ , idx ... ]

             conjunct
                                            adjunct

```
 -->