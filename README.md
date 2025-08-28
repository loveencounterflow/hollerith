

# Hollerith


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Hollerith](#hollerith)
  - [Compact Encoding](#compact-encoding)
    - [Motivation](#motivation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Hollerith

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



