// Romanian display texts: names, short descriptions and facts for the objects in the app.

export const BODY_INFO = {
    Sun: {
        name: 'Soarele', color: '#ffd84d', size: 0.07,
        desc: 'Steaua sistemului nostru solar. Nu privi niciodată direct spre Soare!',
        facts: { 'Diametru': '1.392.700 km', 'Temperatura suprafeței': '≈ 5.500 °C', 'Tip': 'pitică galbenă (G2V)' },
    },
    Moon: {
        name: 'Luna', color: '#f2f2f2', size: 0.07,
        desc: 'Singurul satelit natural al Pământului. Ne arată mereu aceeași față.',
        facts: { 'Diametru': '3.474 km', 'Perioada fazelor': '29,5 zile' },
    },
    Mercury: {
        name: 'Mercur', color: '#c9b8a6', size: 0.025,
        desc: 'Cea mai mică planetă și cea mai apropiată de Soare. Se vede doar jos, la amurg sau în zori.',
        facts: { 'Diametru': '4.879 km', 'An': '88 de zile', 'Sateliți': '0' },
    },
    Venus: {
        name: 'Venus', color: '#fff3c4', size: 0.035,
        desc: '„Luceafărul”. Cel mai strălucitor obiect de pe cer după Soare și Lună, din cauza norilor groși.',
        facts: { 'Diametru': '12.104 km', 'An': '225 de zile', 'Sateliți': '0' },
    },
    Mars: {
        name: 'Marte', color: '#ff7a4d', size: 0.03,
        desc: 'Planeta roșie. Culoarea vine de la oxidul de fier (rugina) de pe suprafață.',
        facts: { 'Diametru': '6.779 km', 'An': '687 de zile', 'Sateliți': '2 (Phobos, Deimos)' },
    },
    Jupiter: {
        name: 'Jupiter', color: '#f5d9a8', size: 0.035,
        desc: 'Cea mai mare planetă. Cu un binoclu poți vedea cei 4 sateliți galileeni.',
        facts: { 'Diametru': '139.820 km', 'An': '11,9 ani', 'Sateliți': '95+' },
    },
    Saturn: {
        name: 'Saturn', color: '#f0dca0', size: 0.032,
        desc: 'Planeta cu inele. Inelele se văd cu un telescop mic.',
        facts: { 'Diametru': '116.460 km', 'An': '29,5 ani', 'Sateliți': '140+' },
    },
    Uranus: {
        name: 'Uranus', color: '#9fe3f0', size: 0.022,
        desc: 'Gigant de gheață care se rotește „culcat” pe o parte. La limita vizibilității cu ochiul liber.',
        facts: { 'Diametru': '50.724 km', 'An': '84 de ani', 'Sateliți': '28' },
    },
    Neptune: {
        name: 'Neptun', color: '#6f8cff', size: 0.02,
        desc: 'Cea mai îndepărtată planetă. Are nevoie de telescop.',
        facts: { 'Diametru': '49.244 km', 'An': '165 de ani', 'Sateliți': '16' },
    },
};

export const ISS_INFO = {
    name: 'Stația Spațială Internațională',
    desc: 'Laborator locuit pe orbită la ~420 km altitudine. Face un ocol complet al Pământului în ~92 de minute și se vede ca un punct luminos care trece rapid, fără să clipească.',
};

// Romanian constellation names, keyed by IAU abbreviation
export const CONST_RO = {
    And: 'Andromeda', Ant: 'Mașina Pneumatică', Aps: 'Pasărea Paradisului', Aqr: 'Vărsătorul', Aql: 'Vulturul',
    Ara: 'Altarul', Ari: 'Berbecul', Aur: 'Vizitiul', Boo: 'Boarul', Cae: 'Dalta', Cam: 'Girafa', Cnc: 'Racul',
    CVn: 'Câinii de Vânătoare', CMa: 'Câinele Mare', CMi: 'Câinele Mic', Cap: 'Capricornul', Car: 'Carena',
    Cas: 'Cassiopeia', Cen: 'Centaurul', Cep: 'Cefeu', Cet: 'Balena', Cha: 'Cameleonul', Cir: 'Compasul',
    Col: 'Porumbelul', Com: 'Părul Berenicei', CrA: 'Coroana Australă', CrB: 'Coroana Boreală', Crv: 'Corbul',
    Crt: 'Cupa', Cru: 'Crucea Sudului', Cyg: 'Lebăda', Del: 'Delfinul', Dor: 'Peștele de Aur', Dra: 'Dragonul',
    Equ: 'Mânzul', Eri: 'Eridanul', For: 'Cuptorul', Gem: 'Gemenii', Gru: 'Cocorul', Her: 'Hercule',
    Hor: 'Orologiul', Hya: 'Hidra', Hyi: 'Hidra Mică', Ind: 'Indianul', Lac: 'Șopârla', Leo: 'Leul',
    LMi: 'Leul Mic', Lep: 'Iepurele', Lib: 'Balanța', Lup: 'Lupul', Lyn: 'Râsul', Lyr: 'Lira', Men: 'Masa',
    Mic: 'Microscopul', Mon: 'Licornul', Mus: 'Musca', Nor: 'Echerul', Oct: 'Octantul', Oph: 'Ofiucus',
    Ori: 'Orion', Pav: 'Păunul', Peg: 'Pegas', Per: 'Perseu', Phe: 'Phoenix', Pic: 'Pictorul', Psc: 'Peștii',
    PsA: 'Peștele Austral', Pup: 'Pupa', Pyx: 'Busola', Ret: 'Reticulul', Sge: 'Săgeata', Sgr: 'Săgetătorul',
    Sco: 'Scorpionul', Scl: 'Sculptorul', Sct: 'Scutul', Ser: 'Șarpele', Ser1: 'Șarpele (Cap)',
    Ser2: 'Șarpele (Coadă)', Sex: 'Sextantul', Tau: 'Taurul', Tel: 'Telescopul', Tri: 'Triunghiul',
    TrA: 'Triunghiul Austral', Tuc: 'Tucanul', UMa: 'Ursa Mare', UMi: 'Ursa Mică', Vel: 'Velele',
    Vir: 'Fecioara', Vol: 'Peștele Zburător', Vul: 'Vulpea',
};

// Short stories for the best known constellations
export const CONST_STORY = {
    Ori: 'Vânătorul uriaș din mitologia greacă. Cele trei stele aliniate formează „Brâul lui Orion” (la noi, „Cei trei crai”).',
    UMa: 'Conține „Carul Mare”. Prelungind de 5 ori latura din spate a carului găsești Steaua Polară.',
    UMi: 'Conține „Carul Mic”. Steaua Polară, din vârful oiștii, arată aproape exact spre nord.',
    Cas: 'Regina vanitoasă din mitul lui Perseu. Se recunoaște ușor după forma de „W”.',
    Cyg: 'Lebăda zboară de-a lungul Căii Lactee. Steaua Deneb este una dintre cele mai luminoase stele cunoscute.',
    Lyr: 'Lira lui Orfeu. Vega, steaua principală, a fost steaua polară acum ~14.000 de ani.',
    Sco: 'Scorpionul trimis să-l învingă pe Orion. De aceea nu sunt niciodată pe cer în același timp.',
    Leo: 'Leul din Nemeea, învins de Hercule. Steaua Regulus marchează inima leului.',
    Tau: 'Taurul în care s-a transformat Zeus. Conține roiurile de stele Pleiadele (Găinușa) și Hiadele.',
    Gem: 'Gemenii Castor și Pollux, frații Dioscuri din mitologia greacă.',
    Per: 'Eroul care a ucis-o pe Meduza și a salvat-o pe Andromeda. De aici vin meteorii Perseide din august.',
    And: 'Prințesa salvată de Perseu. Conține galaxia Andromeda, vizibilă cu ochiul liber pe un cer întunecat.',
    Peg: 'Calul înaripat. „Pătratul lui Pegas” e un reper ușor de găsit pe cerul de toamnă.',
    Her: 'Eroul celor 12 munci. Conține roiul globular M13, cu sute de mii de stele.',
    Sgr: 'Arcașul centaur. În direcția lui se află centrul galaxiei noastre.',
    Aql: 'Vulturul lui Zeus. Altair, steaua principală, se rotește foarte repede în jurul axei sale.',
    Boo: 'Păzitorul urșilor. Arcturus este cea mai strălucitoare stea din emisfera nordică a cerului.',
    Dra: 'Dragonul care păzea merele de aur ale Hesperidelor. Se încolăcește în jurul Ursei Mici.',
    CMa: 'Câinele lui Orion. Conține Sirius, cea mai strălucitoare stea de pe cerul nopții.',
};

// Distances (light years) for the brightest named stars
export const STAR_DIST = {
    Sirius: 8.6, Canopus: 310, Arcturus: 36.7, Vega: 25, Capella: 42.9, Rigel: 860, Procyon: 11.5,
    Betelgeuse: 548, Altair: 16.7, Aldebaran: 65, Antares: 550, Spica: 250, Pollux: 34, Fomalhaut: 25,
    Deneb: 2600, Regulus: 79, Castor: 51, Polaris: 433, Bellatrix: 250, Alnilam: 2000, Mizar: 83,
    Dubhe: 123, Alioth: 83, Algol: 90, Mirfak: 510, Achernar: 139, Hadar: 390, Acrux: 320,
};
