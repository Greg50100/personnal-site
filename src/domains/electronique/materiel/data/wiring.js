/**
 * CÂBLAGE DES MODULES
 * -------------------
 * Branchement type de chaque module sur une carte en 3,3 V (ESP32, ESP8266, Pico, Raspberry Pi), le cas le plus exigeant :
 * les adaptations de niveau y sont toutes visibles. Une ligne relie une broche de la carte à une broche du module :
 *
 *   [carte, module, signal, sens, options]
 *     signal  : 'pwr' | 'gnd' | 'i2c' | 'spi' | 'uart' | 'adc' | 'pwm' | 'gpio' | 'i2s' (couleur du fil)
 *     sens    : '>' de la carte vers le module, '<' du module vers la carte, '<>' dans les deux sens
 *     options : pullup (résistance vers 3,3 V), pulldown (vers la masse), divider [haut, bas] (pont diviseur vers la carte),
 *               series (résistance en série), chip (circuit intercalé), opt (fil facultatif, en pointillés)
 *
 * Les noms de broches sont ceux sérigraphiés sur les modules les plus courants ; les notes complètent celles de modules.js.
 */

const GND = ['GND', 'GND', 'gnd']
const V33 = (pin = 'VCC') => ['3V3', pin, 'pwr']
const V5 = (pin = 'VCC') => ['5V', pin, 'pwr']
/** Alimentation la plus basse acceptée : 3,3 V si possible (signaux alors en 3,3 V), sinon 5 V. */
const power = (m, pin = 'VCC') => (m.supply[0] <= 3.3 ? V33(pin) : V5(pin))

const I2C = (m, pin) => [power(m, pin), GND, ['SDA', 'SDA', 'i2c', '<>'], ['SCL', 'SCL', 'i2c', '>']]
const UART = (m, pin, tx = 'TX', rx = 'RX') => [power(m, pin), GND, ['RX', tx, 'uart', '<'], ['TX', rx, 'uart', '>']]

const I2C_NOTE = 'Résistances de tirage de SDA et SCL : en général déjà sur le module.'

/** Branchement par défaut selon la liaison. */
const BY_BUS = {
  i2c: (m) => ({ rows: I2C(m), notes: [I2C_NOTE] }),
  spi: (m) => ({ rows: [power(m), GND, ['SCK', 'SCK', 'spi', '>'], ['MOSI', 'SDI', 'spi', '>'], ['MISO', 'SDO', 'spi', '<'], ['GPIO', 'CS', 'spi', '>']] }),
  uart: (m) => ({ rows: UART(m) }),
  analog: (m) => ({ rows: [power(m), GND, ['ADC', 'AOUT', 'adc', '<']] }),
  digital: (m) => ({ rows: [power(m), GND, ['GPIO', 'OUT', 'gpio', '<']] }),
  pwm: (m) => ({ rows: [power(m), GND, ['GPIO (PWM)', 'IN', 'pwm', '>']] }),
}

/** Branchements propres à un module. */
const BY_MODULE = {
  dht22: { rows: [V33(), ['GPIO', 'DATA', 'gpio', '<>', { pullup: '10 kΩ' }], GND], notes: ['Résistance de tirage déjà présente sur les modules à trois broches.'] },
  dht11: { rows: [V33(), ['GPIO', 'DATA', 'gpio', '<>', { pullup: '10 kΩ' }], GND], notes: ['Résistance de tirage déjà présente sur les modules à trois broches.'] },
  ds18b20: { rows: [V33('VDD'), ['GPIO', 'DQ', 'gpio', '<>', { pullup: '4,7 kΩ' }], GND], notes: ['Plusieurs sondes en parallèle sur le même fil DQ, une seule résistance de tirage.'] },
  bme280: { rows: [V33('VIN'), GND, ['SDA', 'SDA', 'i2c', '<>'], ['SCL', 'SCL', 'i2c', '>'], ['GND', 'SDO', 'gnd', null, { opt: true }]], notes: ['SDO choisit l’adresse : à la masse 0x76, à VCC 0x77.', I2C_NOTE] },
  bmp280: { rows: [V33('VIN'), GND, ['SDA', 'SDA', 'i2c', '<>'], ['SCL', 'SCL', 'i2c', '>'], ['GND', 'SDO', 'gnd', null, { opt: true }]], notes: ['SDO choisit l’adresse : à la masse 0x76, à VCC 0x77.', I2C_NOTE] },
  bme680: { rows: [V33('VIN'), GND, ['SDA', 'SDA', 'i2c', '<>'], ['SCL', 'SCL', 'i2c', '>'], ['GND', 'SDO', 'gnd', null, { opt: true }]], notes: ['SDO choisit l’adresse : à la masse 0x76, à VCC 0x77.', I2C_NOTE] },
  max31865: { rows: [V33('VIN'), GND, ['SCK', 'CLK', 'spi', '>'], ['MOSI', 'SDI', 'spi', '>'], ['MISO', 'SDO', 'spi', '<'], ['GPIO', 'CS', 'spi', '>']] },
  max31855: { rows: [V33('VIN'), GND, ['SCK', 'CLK', 'spi', '>'], ['MISO', 'DO', 'spi', '<'], ['GPIO', 'CS', 'spi', '>']], notes: ['Lecture seule : pas de fil MOSI.'] },
  mhz19: { rows: UART({ supply: [5] }, 'Vin', 'Tx', 'Rx'), notes: ['Alimentation en 5 V, signaux en 3,3 V : liaison directe.'] },
  'senseair-s8': { rows: [V5('G+'), ['GND', 'G0', 'gnd'], ['RX', 'UART_TxD', 'uart', '<'], ['TX', 'UART_RxD', 'uart', '>']], notes: ['Alimentation en 5 V, signaux en 3,3 V : liaison directe.'] },
  pms5003: { title: 'PMS5003', rows: UART({ supply: [5] }, 'VCC', 'TXD', 'RXD'), notes: ['SET et RESET : en l’air (tirées dans le capteur) ou sur un GPIO pour la mise en veille.'] },
  sds011: { rows: UART({ supply: [5] }, '5V', 'TXD', 'RXD') },
  sps30: {
    rows: [V5('VDD'), GND, ['SDA', 'SDA', 'i2c', '<>', { pullup: 'Rp' }], ['SCL', 'SCL', 'i2c', '>', { pullup: 'Rp' }], ['GND', 'SEL', 'gnd']],
    notes: ['SEL à la masse choisit l’I2C (en l’air : UART).', 'Pas de résistances de tirage dans le capteur : les ajouter vers 3,3 V.'],
  },
  mq: { title: 'Module MQ', rows: [V5(), GND, ['ADC', 'AO', 'adc', '<', { divider: ['10 kΩ', '20 kΩ'] }], ['GPIO', 'DO', 'gpio', '<', { opt: true, divider: ['10 kΩ', '20 kΩ'] }]], notes: ['Le pont (10 kΩ et 20 kΩ) ramène 5 V à 3,3 V.'] },
  ldr: { title: 'Photorésistance', rows: [V33('patte 1'), ['ADC', 'patte 2', 'adc', '<', { pulldown: '10 kΩ' }]], notes: ['Les modules à trois broches (VCC, GND, AO) ont déjà la résistance.'] },
  'hc-sr501': { rows: [V5(), ['GPIO', 'OUT', 'gpio', '<'], GND], notes: ['Sortie en 3,3 V : liaison directe.'] },
  am312: { rows: [V33('VIN'), ['GPIO', 'OUT', 'gpio', '<'], GND] },
  ld2410: { title: 'LD2410', rows: [...UART({ supply: [5] }), ['GPIO', 'OUT', 'gpio', '<', { opt: true }]], notes: ['Signaux en 3,3 V ; OUT (présence) est facultatif, l’UART donne tout.'] },
  ld2450: { title: 'LD2450', rows: UART({ supply: [5] }, '5V'), notes: ['Signaux en 3,3 V : liaison directe.'] },
  'rcwl-0516': { rows: [V5('VIN'), ['GPIO', 'OUT', 'gpio', '<'], GND], notes: ['Sortie en 3,3 V : liaison directe.'] },
  'hc-sr04': { rows: [V5(), ['GPIO', 'TRIG', 'gpio', '>'], ['GPIO', 'ECHO', 'gpio', '<', { divider: ['1 kΩ', '2 kΩ'] }], GND] },
  vl53l0x: { rows: [V33('VIN'), GND, ['SDA', 'SDA', 'i2c', '<>'], ['SCL', 'SCL', 'i2c', '>'], ['GPIO', 'XSHUT', 'gpio', '>', { opt: true }]], notes: ['XSHUT sert à donner une adresse différente à chaque capteur au démarrage.'] },
  ina219: { rows: I2C({ supply: [3] }), notes: ['Le courant mesuré traverse VIN+ et VIN− (côté charge).', I2C_NOTE] },
  ina226: { rows: I2C({ supply: [3] }), notes: ['Le courant mesuré traverse le shunt (IN+ et IN−).', I2C_NOTE] },
  acs712: { rows: [V5(), GND, ['ADC', 'OUT', 'adc', '<', { divider: ['10 kΩ', '20 kΩ'] }]], notes: ['Le pont (10 kΩ et 20 kΩ) ramène 5 V à 3,3 V ; au repos la sortie vaut la moitié de l’alimentation.'] },
  sct013: {
    title: 'SCT-013',
    rows: [V33('polarisation +'), ['ADC', 'jack', 'adc', '<'], ['GND', 'polarisation −', 'gnd']],
    notes: ['Deux résistances de 10 kΩ entre 3,3 V et la masse, découplées par 10 µF, polarisent le jack au milieu (1,65 V).', 'Modèle sans résistance de charge (SCT-013-000) : en ajouter une aux bornes du jack.'],
  },
  pzem004t: { title: 'PZEM-004T', rows: UART({ supply: [3.3] }, '5V'), notes: ['La broche « 5V » accepte 3,3 V : les signaux sont alors en 3,3 V.'] },
  hx711: { rows: [V33(), GND, ['GPIO', 'SCK', 'gpio', '>'], ['GPIO', 'DT', 'gpio', '<']], notes: ['Cellule de charge sur E+, E−, A− et A+.'] },
  'sol-capacitif': { title: 'Sonde capacitive', rows: [V33(), GND, ['ADC', 'AOUT', 'adc', '<']] },
  ssd1306: { title: 'OLED SSD1306', rows: I2C({ supply: [3.3] }), notes: [I2C_NOTE] },
  'tft-spi': {
    title: 'Écran TFT',
    rows: [V33(), GND, ['SCK', 'SCK / SCL', 'spi', '>'], ['MOSI', 'SDI / SDA', 'spi', '>'], ['GPIO', 'CS', 'spi', '>'], ['GPIO', 'DC', 'gpio', '>'], ['GPIO', 'RST', 'gpio', '>'], ['GPIO (PWM)', 'BL / LED', 'pwm', '>']],
    notes: ['Sur ces écrans, SCL et SDA désignent l’horloge et les données SPI.'],
  },
  epaper: {
    title: 'Écran e-paper',
    rows: [V33(), GND, ['MOSI', 'DIN', 'spi', '>'], ['SCK', 'CLK', 'spi', '>'], ['GPIO', 'CS', 'spi', '>'], ['GPIO', 'DC', 'gpio', '>'], ['GPIO', 'RST', 'gpio', '>'], ['GPIO', 'BUSY', 'gpio', '<']],
  },
  ws2812b: {
    title: 'Ruban WS2812B',
    rows: [['bloc 5 V', '+5V', 'pwr'], ['GPIO', 'DIN', 'gpio', '>', { chip: '74AHCT125', series: '330 Ω' }], GND],
    notes: ['Masse commune entre la carte, le bloc 5 V et le ruban ; 1 000 µF aux bornes de l’alimentation du ruban.'],
  },
  relais: { title: 'Module relais', rows: [V5(), ['GPIO', 'IN', 'gpio', '>'], GND], notes: ['Sur une carte 3,3 V : module « déclenchement 3,3 V » ou transistor de commande.'] },
  mosfet: {
    title: 'MOSFET',
    rows: [['GPIO (PWM)', 'G (grille)', 'pwm', '>', { series: '100 Ω', pulldown: '10 kΩ' }], ['GND', 'S (source)', 'gnd']],
    notes: ['La charge se branche entre le + de son alimentation et D (drain) ; masses communes.'],
  },
  servo: { title: 'Servo SG90', rows: [['bloc 5 V', '+ (rouge)', 'pwr'], ['GPIO (PWM)', 'signal (orange)', 'pwm', '>'], ['GND', '− (marron)', 'gnd']], notes: ['Masse commune entre la carte et le bloc 5 V.'] },
  'pas-a-pas': {
    title: 'A4988 / DRV8825',
    rows: [V33('VDD'), GND, ['GPIO', 'STEP', 'gpio', '>'], ['GPIO', 'DIR', 'gpio', '>'], ['GPIO', 'EN', 'gpio', '>', { opt: true }]],
    notes: ['Moteur sur 1A, 1B, 2A et 2B ; son alimentation (12 ou 24 V en général) sur VMOT.', 'A4988 : relier RESET à SLEEP.'],
  },
  uln2003: {
    title: 'Carte ULN2003',
    rows: [['bloc 5 V', '+', 'pwr'], ['GND', '−', 'gnd'], ['GPIO', 'IN1', 'gpio', '>'], ['GPIO', 'IN2', 'gpio', '>'], ['GPIO', 'IN3', 'gpio', '>'], ['GPIO', 'IN4', 'gpio', '>']],
  },
  'pont-h': {
    title: 'TB6612FNG',
    rows: [V33(), GND, ['GPIO (PWM)', 'PWMA', 'pwm', '>'], ['GPIO', 'AIN1', 'gpio', '>'], ['GPIO', 'AIN2', 'gpio', '>'], ['3V3', 'STBY', 'pwr']],
    notes: ['Moteur sur AO1 et AO2, son alimentation sur VM ; STBY à l’état haut active le pilote.'],
  },
  inmp441: { rows: [V33('VDD'), GND, ['BCLK', 'SCK', 'i2s', '>'], ['WS (LRCLK)', 'WS', 'i2s', '>'], ['DIN', 'SD', 'i2s', '<'], ['GND', 'L/R', 'gnd']] },
  max98357a: { rows: [V5('Vin'), GND, ['BCLK', 'BCLK', 'i2s', '>'], ['WS (LRCLK)', 'LRC', 'i2s', '>'], ['DOUT', 'DIN', 'i2s', '>']] },
  ads1115: { rows: [...I2C({ supply: [2] }), ['GND', 'ADDR', 'gnd']], notes: ['ADDR à la masse : adresse 0x48.', I2C_NOTE] },
  ds3231: { title: 'DS3231', rows: I2C({ supply: [2.3] }), notes: [I2C_NOTE] },
  bss138: {
    title: 'BSS138 (4 voies)',
    rows: [V33('LV'), V5('HV'), GND, ['GPIO / SDA', 'LV1', 'gpio', '<>']],
    notes: ['HV1, la voie correspondante, part vers le signal du module en 5 V.'],
  },
  '74ahct125': { rows: [V5(), GND, ['GND', '1OE', 'gnd'], ['GPIO', '1A', 'gpio', '>']], notes: ['1Y sort le même signal en 5 V (données des LED WS2812).'] },
  microsd: { title: 'Lecteur microSD', rows: [V33(), GND, ['SCK', 'SCK', 'spi', '>'], ['MOSI', 'MOSI', 'spi', '>'], ['MISO', 'MISO', 'spi', '<'], ['GPIO', 'CS', 'spi', '>']] },
}

/** Câblage d'un module : { title, rows, notes }, ou null pour les alimentations. */
export function wiringOf(m) {
  if (m.bus === 'power') return null
  const own = BY_MODULE[m.id]
  const base = own ?? BY_BUS[m.bus]?.(m)
  if (!base) return null
  return { title: own?.title ?? m.name.split(/ \(| \/ /)[0], rows: base.rows, notes: base.notes ?? [] }
}
