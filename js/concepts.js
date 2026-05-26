// ============================================================
// SSC CGL — CONCEPT LIBRARY WITH SHORTCUT METHODS
// ============================================================

const CONCEPTS = {

  "Number System": {
    icon: "🔢",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Divisibility Rules",
        content: `
<b>Divisibility Rules (Must Know)</b>
• <b>By 2:</b> Last digit is 0,2,4,6,8
• <b>By 3:</b> Sum of digits divisible by 3
• <b>By 4:</b> Last 2 digits divisible by 4
• <b>By 5:</b> Last digit is 0 or 5
• <b>By 6:</b> Divisible by both 2 and 3
• <b>By 8:</b> Last 3 digits divisible by 8
• <b>By 9:</b> Sum of digits divisible by 9
• <b>By 11:</b> (Sum of odd-position digits) - (Sum of even-position digits) = 0 or multiple of 11
        `
      },
      {
        title: "HCF and LCM Shortcuts",
        content: `
<b>Key Formulas:</b>
• HCF × LCM = Product of two numbers
• HCF of fractions = HCF of numerators / LCM of denominators
• LCM of fractions = LCM of numerators / HCF of denominators

<b>Shortcut for HCF:</b> Successive division method — divide larger by smaller, then divisor by remainder until remainder = 0.

<b>Shortcut for Unit Digit:</b>
• Powers of 2: cycle is 2,4,8,6 (period 4)
• Powers of 3: cycle is 3,9,7,1 (period 4)
• Powers of 7: cycle is 7,9,3,1 (period 4)
• Powers of 8: cycle is 8,4,2,6 (period 4)
• Powers of 4,9: period 2
• Powers of 0,1,5,6: always same digit
        `
      },
      {
        title: "Remainder Theorems",
        content: `
<b>Remainder Shortcuts:</b>
• (a+b)/n: remainder = (rem_a + rem_b)/n
• (a×b)/n: remainder = (rem_a × rem_b)/n
• For cyclicity: find remainder of power ÷ cycle length

<b>Example:</b> 2³¹ ÷ 5 → cycle of 2 mod 5 = 4, 31%4=3, 3rd in cycle {2,4,3,1} = 3
        `
      }
    ]
  },

  "Percentage": {
    icon: "💯",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Key Percentage Formulas",
        content: `
<b>Essential Formulas:</b>
• % change = (Change/Original) × 100
• If A is x% more than B → B is x/(100+x) × 100 % less than A
• If A is x% less than B → B is x/(100-x) × 100 % more than A

<b>Quick Table:</b>
• A 20% more than B → B is 16.67% less than A
• A 25% more than B → B is 20% less than A
• A 50% more than B → B is 33.33% less than A

<b>Successive % change:</b>
Net effect of x% then y% change = (x + y + xy/100)%
(negative for decrease)
        `
      },
      {
        title: "Election & Population Problems",
        content: `
<b>Election Problems:</b>
• If winner gets x% and wins by 'd' votes:
  Total votes = d / (x% - (100-x)%)
  
<b>Population Formula:</b>
• P(n) = P₀ × (1 + r/100)ⁿ

<b>Shortcut for 1% of big numbers:</b>
• 1% of 6500 = 65 (just move decimal 2 places left)
        `
      }
    ]
  },

  "Profit and Loss": {
    icon: "📈",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Core Formulas",
        content: `
<b>Basic Formulas:</b>
• Profit% = (Profit/CP) × 100
• Loss% = (Loss/CP) × 100
• SP = CP × (100 + Profit%) / 100
• CP = SP × 100 / (100 + Profit%)

<b>Marked Price & Discount:</b>
• Discount = MP - SP
• Discount% = (Discount/MP) × 100

<b>Combined Effect:</b>
Net Profit% = [(100+P)(100-D)/100] - 100
        `
      },
      {
        title: "Shortcuts and Tricks",
        content: `
<b>Two Items at Same SP, Same %P&L:</b>
→ Always a NET LOSS. Loss% = (x/10)² %
Example: Both at 10% → Loss = 1%

<b>SP expressed in terms of CP:</b>
• Profit of x% means SP = (100+x)/100 × CP
• Loss of x% means SP = (100-x)/100 × CP

<b>Dishonest Trader Trick:</b>
Uses w grams instead of W grams:
Profit% = (W-w)/w × 100 (when no declared P/L)
Overall Profit = Declared% + Extra from cheating%
        `
      }
    ]
  },

  "Simple and Compound Interest": {
    icon: "🏦",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "SI vs CI Formulas",
        content: `
<b>Simple Interest:</b>
SI = P × R × T / 100
A = P + SI

<b>Compound Interest:</b>
A = P(1 + R/100)ᵀ
CI = A - P

<b>Key Relationship:</b>
CI - SI (for 2 years) = P(R/100)²
CI - SI (for 3 years) = P(R/100)² × (R/100 + 3)
        `
      },
      {
        title: "Shortcuts for Common Cases",
        content: `
<b>Doubling Time:</b>
• At R% SI: Time = 100/R years
• At R% CI: Use Rule of 72 → Time ≈ 72/R years

<b>Half-Yearly Compounding:</b>
A = P(1 + R/200)^(2T)

<b>Finding Rate from Amount:</b>
If sum becomes A₁ in n years and A₂ in (n+1) years:
R% = (A₂ - A₁)/A₁ × 100

<b>Common CI Values (P=1000):</b>
• 5% for 2yr: CI = 102.5
• 10% for 2yr: CI = 210
• 10% for 3yr: CI = 331
        `
      }
    ]
  },

  "Ratio and Proportion": {
    icon: "⚖️",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Ratio Fundamentals",
        content: `
<b>Key Concepts:</b>
• a:b = c:d → ad = bc (cross multiply)
• Mean proportion of a and c: b = √(ac)
• Third proportion: if a:b = b:x → x = b²/a

<b>Combining Ratios:</b>
A:B = 2:3, B:C = 4:5
→ Multiply: A:B:C = 8:12:15

<b>Partnership:</b>
Profit ratio = Capital × Time (for each partner)
        `
      },
      {
        title: "Mixture & Alligation",
        content: `
<b>Alligation Rule:</b>
Cheaper ─── Cost Price ─── Dearer
(d-m)                    (m-c)
Ratio of mixing = (d-m) : (m-c)

<b>Repeated Dilution:</b>
After n operations with vessel capacity V and each time x is removed:
Amount remaining = V × (1 - x/V)ⁿ
        `
      }
    ]
  },

  "Time and Work": {
    icon: "⚙️",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Work Formulas",
        content: `
<b>Core Concept:</b>
Work rate = 1/Days
If A takes 'a' days and B takes 'b' days:
Together = ab/(a+b) days

<b>Unit Method:</b>
Take LCM of all days as total work.
Work rate of each person = Total Work / Their Days

<b>Men × Days = Constant:</b>
M₁ × D₁ = M₂ × D₂
Extension: M₁ × D₁ × H₁ = M₂ × D₂ × H₂
        `
      },
      {
        title: "Pipe and Cistern Tricks",
        content: `
<b>Filling Pipe (positive):</b> Rate = +1/T
<b>Emptying Pipe (negative):</b> Rate = -1/T

<b>Both open together:</b>
Net Rate = Fill Rate - Empty Rate
Time = 1/Net Rate

<b>Trick:</b> If fill time = F and empty time = E:
Time to fill when both open = FE/(E-F)
(only works if E > F, otherwise never fills)
        `
      }
    ]
  },

  "Speed Distance Time": {
    icon: "🚂",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Core Formulas",
        content: `
<b>Basic:</b>
Speed = Distance / Time
D = S × T, T = D/S

<b>Average Speed:</b>
If equal DISTANCES at speeds s₁ and s₂:
Avg speed = 2s₁s₂/(s₁+s₂) (Harmonic Mean)

If equal TIMES at speeds s₁ and s₂:
Avg speed = (s₁+s₂)/2 (Arithmetic Mean)

<b>Conversion:</b>
km/h to m/s: multiply by 5/18
m/s to km/h: multiply by 18/5
        `
      },
      {
        title: "Train Problems",
        content: `
<b>Train crossing a pole/person:</b>
Time = Train Length / Train Speed

<b>Train crossing a platform/bridge:</b>
Time = (Train Length + Platform Length) / Speed

<b>Two trains (opposite direction):</b>
Time = (L₁ + L₂) / (S₁ + S₂) [Relative speed = sum]

<b>Two trains (same direction):</b>
Time = (L₁ + L₂) / |S₁ - S₂| [Relative speed = difference]

<b>Boats and Streams:</b>
Downstream speed = B + S
Upstream speed = B - S
B (boat speed) = (Down + Up)/2
S (stream speed) = (Down - Up)/2
        `
      }
    ]
  },

  "Algebra": {
    icon: "📐",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Important Identities",
        content: `
<b>Must-Know Algebraic Identities:</b>
• (a+b)² = a²+2ab+b²
• (a-b)² = a²-2ab+b²
• a²-b² = (a+b)(a-b)
• (a+b)³ = a³+3a²b+3ab²+b³
• a³+b³ = (a+b)(a²-ab+b²)
• a³-b³ = (a-b)(a²+ab+b²)

<b>If x+1/x = k:</b>
• x²+1/x² = k²-2
• x³+1/x³ = k³-3k
• x⁴+1/x⁴ = (k²-2)²-2
        `
      },
      {
        title: "Rationalization",
        content: `
<b>Rationalizing Surds:</b>
1/(a+√b) → multiply by (a-√b)/(a-√b)
1/(√a+√b) → multiply by (√a-√b)/(√a-√b)

<b>Shortcut:</b>
(√a+√b)(√a-√b) = a-b
(a+√b)(a-√b) = a²-b

<b>Value finding:</b>
If a+b+c = 0, then a³+b³+c³ = 3abc
        `
      }
    ]
  },

  "Geometry and Mensuration": {
    icon: "📏",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Key Theorems",
        content: `
<b>Important Theorems:</b>
• Pythagoras: a²+b²=c² (right triangle)
• Thales: Angle in semicircle = 90°
• External angle = Sum of two non-adjacent interior angles
• Sum of angles of triangle = 180°
• Exterior angle of polygon = 360°/n

<b>Pythagorean Triplets:</b>
3-4-5, 5-12-13, 8-15-17, 7-24-25

<b>Circle Properties:</b>
• Angle at center = 2 × angle at circumference
• Equal chords are equidistant from center
• Tangent ⊥ radius at point of tangency
        `
      },
      {
        title: "Area and Volume Formulas",
        content: `
<b>2D Shapes:</b>
• Triangle: ½bh | Heron's: √(s(s-a)(s-b)(s-c))
• Circle: πr² | Circumference: 2πr
• Rectangle: lb | Square: a²
• Trapezium: ½(a+b)h
• Rhombus: ½d₁d₂
• Parallelogram: base × height

<b>3D Shapes:</b>
• Cube: V=a³, SA=6a²
• Cuboid: V=lbh, SA=2(lb+bh+hl)
• Cylinder: V=πr²h, CSA=2πrh
• Cone: V=⅓πr²h, Slant=√(r²+h²)
• Sphere: V=4/3πr³, SA=4πr²
        `
      }
    ]
  },

  "Trigonometry": {
    icon: "📐",
    subject: "Quantitative Aptitude",
    concepts: [
      {
        title: "Standard Values Table",
        content: `
<b>Trigonometry Table (Must Memorize):</b>
<pre>
θ    | 0°  | 30°  | 45°  | 60°  | 90°
-----|-----|------|------|------|-----
sin  |  0  |  ½   | 1/√2 | √3/2 |  1
cos  |  1  | √3/2 | 1/√2 |  ½   |  0
tan  |  0  | 1/√3 |  1   |  √3  |  ∞
</pre>

<b>Memory Trick for sin: √0/2, √1/2, √2/2, √3/2, √4/2</b>
        `
      },
      {
        title: "Identities and Formulas",
        content: `
<b>Pythagorean Identities:</b>
• sin²θ + cos²θ = 1
• 1 + tan²θ = sec²θ
• 1 + cot²θ = cosec²θ

<b>Complementary Angles:</b>
• sin(90-θ) = cosθ
• cos(90-θ) = sinθ
• tan(90-θ) = cotθ

<b>sec θ + tan θ = x → sec θ - tan θ = 1/x</b>
<b>cosec θ + cot θ = x → cosec θ - cot θ = 1/x</b>

<b>Heights and Distances:</b>
Angle of elevation: tan θ = Height / Base
        `
      }
    ]
  },

  "Analogy": {
    icon: "🔗",
    subject: "Reasoning",
    concepts: [
      {
        title: "Types of Analogies",
        content: `
<b>Common Analogy Types in SSC CGL:</b>
1. <b>Tool-Function:</b> Knife:Stab :: Club:Bludgeon
2. <b>Worker-Workplace:</b> Doctor:Hospital :: Teacher:School
3. <b>Object-Category:</b> Rose:Flower :: Mango:Fruit
4. <b>Part-Whole:</b> Chapter:Book :: Page:Chapter
5. <b>Object-Use:</b> Pen:Write :: Knife:Cut
6. <b>Degree of Intensity:</b> Warm:Hot :: Cool:Cold
7. <b>Antonym:</b> Day:Night :: Hot:Cold
8. <b>Letter Pattern:</b> ACE:GIK (same pattern applied)

<b>Strategy:</b> First establish the relationship in the question pair, then find same relationship in the answer.
        `
      }
    ]
  },

  "Number Series": {
    icon: "🔢",
    subject: "Reasoning",
    concepts: [
      {
        title: "Series Patterns",
        content: `
<b>Common Patterns:</b>
1. <b>Arithmetic:</b> Constant difference (2,5,8,11...)
2. <b>Geometric:</b> Constant ratio (2,4,8,16...)
3. <b>Squares/Cubes:</b> 1,4,9,16... or 1,8,27,64...
4. <b>Fibonacci:</b> Each term = sum of previous two
5. <b>Alternating:</b> Two interleaved series
6. <b>Double difference:</b> Differences are in AP/GP

<b>Strategy for SSC CGL:</b>
1. Check consecutive differences
2. If not arithmetic, check ratios
3. Look for squares/cubes
4. Try alternate terms as separate series
5. Check if differences themselves form a pattern
        `
      }
    ]
  },

  "Coding Decoding": {
    icon: "🔐",
    subject: "Reasoning",
    concepts: [
      {
        title: "Coding Methods",
        content: `
<b>Types of Coding:</b>
1. <b>Letter Shift:</b> Each letter +n or -n positions
2. <b>Number Code:</b> A=1, B=2... or A=26, B=25...
3. <b>Reverse Alphabet:</b> A=Z, B=Y... (A+Z=27)
4. <b>Position-wise:</b> Different shift for each position
5. <b>Word meaning:</b> Symbolic coding

<b>Quick Tricks:</b>
• If A→C (shift 2), check if all letters shift by 2
• For opposite letters: A↔Z, B↔Y, C↔X (sum=27)
• Reversed word coding: check if word is reversed
• Sum of letter positions: CAT = 3+1+20 = 24
        `
      }
    ]
  },

  "Syllogism": {
    icon: "💭",
    subject: "Reasoning",
    concepts: [
      {
        title: "Syllogism Rules",
        content: `
<b>Valid Conclusions:</b>
• All A are B + All B are C → All A are C ✓
• All A are B + Some B are C → Some A may be C (uncertain)
• No A is B + All C are A → No C is B ✓
• Some A are B + No B is C → Some A are not C ✓

<b>Key Rules:</b>
1. Negative + Negative → No conclusion
2. Particular + Particular → No conclusion
3. At least one Universal for Universal conclusion
4. At least one Negative for Negative conclusion

<b>Venn Diagram Method:</b>
Draw all possible Venn diagrams for given statements.
A conclusion is valid ONLY if it holds in ALL diagrams.
        `
      }
    ]
  },

  "Synonyms": {
    icon: "📚",
    subject: "English",
    concepts: [
      {
        title: "High Frequency Words for SSC CGL",
        content: `
<b>Must-Know Synonyms:</b>
• Ephemeral = Transient, Fleeting, Temporary
• Magnanimous = Generous, Benevolent, Charitable
• Loquacious = Garrulous, Talkative, Voluble
• Obstinate = Stubborn, Adamant, Intransigent
• Prolific = Productive, Fertile, Abundant
• Verbose = Wordy, Long-winded, Prolix
• Concise = Brief, Succinct, Terse, Laconic
• Benevolent = Kind, Philanthropic, Altruistic
• Diligent = Industrious, Assiduous, Sedulous
• Frugal = Thrifty, Economical, Parsimonious

<b>Strategy:</b> Learn root words.
- <i>bene</i> = good (benefit, benevolent, benefactor)
- <i>mal</i> = bad (malevolent, malign, malice)
- <i>loqui</i> = speak (loquacious, soliloquy, eloquent)
        `
      }
    ]
  },

  "Antonyms": {
    icon: "🔄",
    subject: "English",
    concepts: [
      {
        title: "Common Antonym Pairs",
        content: `
<b>Must-Know Antonym Pairs:</b>
• Indigenous ↔ Foreign/Exotic
• Verbose ↔ Concise/Laconic
• Diligent ↔ Lazy/Indolent
• Perilous ↔ Safe/Secure
• Frugal ↔ Wasteful/Extravagant
• Ephemeral ↔ Eternal/Permanent
• Magnanimous ↔ Mean/Petty
• Loquacious ↔ Taciturn/Reticent
• Obstinate ↔ Flexible/Compliant
• Prolific ↔ Barren/Sterile

<b>Prefix Tricks:</b>
Adding negative prefix changes to antonym:
• un- (unfair, unhappy)
• dis- (disloyal, dishonest)
• im-/in- (impossible, indecent)
• ir- (irregular, irrelevant)
        `
      }
    ]
  },

  "Fill in the Blanks": {
    icon: "✏️",
    subject: "English",
    concepts: [
      {
        title: "Grammar Rules for Fill in the Blanks",
        content: `
<b>Subject-Verb Agreement:</b>
• Collective nouns (committee, team, jury) → singular verb
• 'Each/Every/Either/Neither' → singular verb
• 'Neither...nor/Either...or' → verb agrees with nearer subject
• Uncountable nouns (news, furniture, advice) → singular

<b>Tense Rules:</b>
• 'Since/For' with perfect tenses
• 'When' clauses → Simple past (not continuous)
• 'Recently/Just/Already/Yet' → Present perfect
• 'Yesterday/Last week/Ago' → Simple past

<b>Preposition Rules:</b>
• Prefer X TO Y (not than)
• Senior/Junior/Prior/Inferior/Superior TO
• Married TO (not with)
• Die OF disease, die FROM wounds
        `
      }
    ]
  },

  "Error Detection": {
    icon: "🔍",
    subject: "English",
    concepts: [
      {
        title: "Common Error Types",
        content: `
<b>Most Common Errors in SSC CGL:</b>

1. <b>Subject-Verb Agreement:</b>
   ✗ Each student have → ✓ Each student has
   
2. <b>Wrong Pronoun:</b>
   ✗ Between you and I → ✓ Between you and me
   
3. <b>Tense Inconsistency:</b>
   ✗ He came and eats → ✓ He came and ate
   
4. <b>Wrong Preposition:</b>
   ✗ Junior than → ✓ Junior to
   ✗ Die from cancer → ✓ Die of cancer
   
5. <b>Double Negative:</b>
   ✗ I don't know nothing → ✓ I don't know anything
   
6. <b>Misplaced Modifier:</b>
   ✗ He nearly drove 100km → ✓ He drove nearly 100km
        `
      }
    ]
  },

  "One Word Substitution": {
    icon: "💬",
    subject: "English",
    concepts: [
      {
        title: "High-Frequency One Word Substitutions",
        content: `
<b>Most Asked in SSC CGL:</b>
<b>Phobias:</b>
• Hydrophobia = Fear of water
• Claustrophobia = Fear of enclosed spaces
• Acrophobia = Fear of heights
• Xenophobia = Fear of foreigners

<b>-cide words (killing):</b>
• Patricide = Father | Matricide = Mother
• Fratricide = Brother | Sororicide = Sister
• Infanticide = Infant | Regicide = King
• Genocide = Race | Suicide = Self

<b>-logy words (study of):</b>
• Osteology = Bones | Cardiology = Heart
• Ornithology = Birds | Entomology = Insects
• Seismology = Earthquakes | Oncology = Cancer

<b>-mania words (craving for):</b>
• Kleptomania = Stealing | Pyromania = Fire
• Megalomania = Grandeur | Dipsomania = Alcohol
        `
      }
    ]
  },

  "Idioms and Phrases": {
    icon: "🗣️",
    subject: "English",
    concepts: [
      {
        title: "Common Idioms for SSC CGL",
        content: `
<b>Must-Know Idioms:</b>
• <b>Bite the bullet</b> = Endure pain/difficult situation
• <b>Burn bridges</b> = Destroy relationships permanently
• <b>Burning midnight oil</b> = Working late at night
• <b>Blessing in disguise</b> = Bad thing turns out good
• <b>Beat around the bush</b> = Avoid the main topic
• <b>Hit the nail on the head</b> = Be exactly right
• <b>Spill the beans</b> = Reveal a secret
• <b>Let the cat out of the bag</b> = Accidentally reveal secret
• <b>Kick the bucket</b> = Die
• <b>Couch potato</b> = Lazy person
• <b>Hit the sack</b> = Go to sleep
• <b>Under the weather</b> = Feeling ill
• <b>Break the ice</b> = Start a conversation
• <b>Piece of cake</b> = Very easy task
• <b>Once in a blue moon</b> = Very rarely
        `
      }
    ]
  },

  "Ancient History": {
    icon: "🏛️",
    subject: "General Awareness",
    concepts: [
      {
        title: "Key Facts - Ancient India",
        content: `
<b>Important Dates:</b>
• Indus Valley Civilization: 3300-1300 BCE (discovered 1921)
• Vedic Period: 1500-500 BCE
• Buddhism founded: 563-483 BCE (Siddhartha Gautama)
• Jainism founded: 599-527 BCE (Mahavira)
• Mauryan Empire: 321-185 BCE
• Ashoka's reign: 268-232 BCE

<b>Dynasties Timeline:</b>
Nanda → Maurya → Sunga → Kanva → Satavahana → Gupta

<b>Important Works:</b>
• Arthashastra: Kautilya (Chanakya)
• Indica: Megasthenes
• Mricchakatika: Shudraka
• Mudrarakshasa: Vishakhadatta
        `
      }
    ]
  },

  "Indian Polity": {
    icon: "⚖️",
    subject: "General Awareness",
    concepts: [
      {
        title: "Constitutional Basics",
        content: `
<b>Important Articles:</b>
• Art. 12-35: Fundamental Rights
• Art. 36-51: Directive Principles
• Art. 51A: Fundamental Duties (42nd Amendment, 1976)
• Art. 352: National Emergency
• Art. 356: President's Rule
• Art. 370: Special status J&K (now abrogated)

<b>Key Borrowed Features:</b>
• USA: Judicial Review, Fundamental Rights, Impeachment
• UK: Parliamentary system, Rule of Law, Cabinet
• Ireland: Directive Principles
• Canada: Federal structure with strong Centre
• Australia: Joint sitting of Parliament
• France: Liberty, Equality, Fraternity

<b>Schedules:</b>
1st-States & UTs | 3rd-Oaths | 7th-3 Lists | 8th-22 Languages
        `
      }
    ]
  },

  "Science": {
    icon: "🔬",
    subject: "General Awareness",
    concepts: [
      {
        title: "Physics Essentials",
        content: `
<b>Newton's Laws:</b>
1. Law of Inertia: Object remains at rest/motion unless external force
2. F = ma
3. Every action has equal and opposite reaction

<b>Units (SI):</b>
• Length: metre (m) | Mass: kilogram (kg) | Time: second (s)
• Electric current: ampere (A) | Temperature: kelvin (K)
• Resistance: ohm (Ω) | Power: watt (W) | Energy: joule (J)
• Frequency: hertz (Hz) | Pressure: pascal (Pa)

<b>Speed of Light:</b> 3×10⁸ m/s
<b>Speed of Sound in air:</b> 343 m/s (at 20°C)
<b>Acceleration due to gravity:</b> 9.8 m/s²
        `
      },
      {
        title: "Biology Essentials",
        content: `
<b>Vitamins and Deficiency Diseases:</b>
• Vitamin A: Night blindness
• Vitamin B1 (Thiamine): Beriberi
• Vitamin C (Ascorbic acid): Scurvy
• Vitamin D: Rickets
• Vitamin K: Blood clotting problems

<b>Photosynthesis:</b>
6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂
Occurs in: Chloroplasts (contains chlorophyll)

<b>Cell:</b>
• Powerhouse: Mitochondria
• Control center: Nucleus
• Protein synthesis: Ribosome
        `
      }
    ]
  },

  "Indian Geography": {
    icon: "🗺️",
    subject: "General Awareness",
    concepts: [
      {
        title: "Key Geographic Facts",
        content: `
<b>Rivers:</b>
• Longest: Ganga (2525 km) | Largest by volume: Brahmaputra
• Godavari = Dakshin Ganga
• Brahmaputra: Tibet (Yarlung Tsangpo) → Arunachal → Assam → Bangladesh (Jamuna)

<b>States:</b>
• Largest by area: Rajasthan | Smallest: Goa
• Largest by population: UP | Most districts: UP
• Northernmost: J&K | Southernmost: Tamil Nadu

<b>National Parks in Northeast:</b>
• Kaziranga (Assam): One-horned Rhino
• Manas (Assam): Tiger, Elephant
• Namdapha (Arunachal): Snow Leopard
• Keibul Lamjao (Manipur): Only floating national park

<b>Passes:</b>
• Nathu La (Sikkim): India-China trade
• Rohtang (HP): Manali side
• Banihal (J&K): National Highway
        `
      }
    ]
  },

  "Economics": {
    icon: "💹",
    subject: "General Awareness",
    concepts: [
      {
        title: "Economic Terms and Concepts",
        content: `
<b>Key Economic Terms:</b>
• GDP: Total value of goods/services produced in country
• GNP: GDP + income from abroad - foreign income in country
• NNP: GNP - Depreciation
• Inflation: General rise in price levels
• Deflation: General fall in price levels
• Stagflation: High inflation + High unemployment

<b>Banking:</b>
• RBI: Central bank, established 1935
• CRR (Cash Reserve Ratio): % of deposits kept with RBI
• SLR (Statutory Liquidity Ratio): % kept in liquid assets
• Repo Rate: Rate at which RBI lends to commercial banks
• Reverse Repo: Rate at which RBI borrows from commercial banks

<b>Five Year Plans:</b>
• 1st Plan (1951-56): Agriculture
• 5th Plan (1974-79): Garibi Hatao
• 8th Plan (1992-97): Human Development
• Planning Commission replaced by NITI Aayog (2015)
        `
      }
    ]
  },

  "Static GK": {
    icon: "📖",
    subject: "General Awareness",
    concepts: [
      {
        title: "India's National Symbols",
        content: `
<b>National Symbols of India:</b>
• Animal: Bengal Tiger
• Bird: Peacock
• Flower: Lotus
• Fruit: Mango
• Tree: Banyan
• River: Ganga
• Sport: Hockey (unofficial)
• Currency Symbol: ₹ (designed by Udaya Kumar)
• Emblem: Lion Capital of Ashoka (from Sarnath)
• Song: Vande Mataram (by Bankimchandra Chattopadhyay)
• Anthem: Jana Gana Mana (by Rabindranath Tagore)

<b>Important Days:</b>
• Jan 26: Republic Day | Aug 15: Independence Day
• Oct 2: Gandhi Jayanti | Nov 14: Children's Day
• Dec 10: Human Rights Day | Mar 8: Women's Day
• Apr 22: Earth Day | Jun 5: World Environment Day
        `
      }
    ]
  },

};

function getConceptForTopic(topic) {
  return CONCEPTS[topic] || null;
}

function getRelatedConcepts(weakTopics) {
  return weakTopics.map(topic => ({
    topic,
    concept: CONCEPTS[topic] || null
  })).filter(c => c.concept !== null);
}
