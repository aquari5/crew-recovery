// How each indicator is measured in flight today, and what space agencies have
// measured in real crews. This ties the tool to hardware and data that exist:
// nothing here asks for a sensor that has not flown.
//
// Every entry was checked against the linked source on 14 Nov 2026.

import type { IndicatorId } from './types'

export interface FlightNote {
  /** The instrument or method used in flight. */
  text: string
  source: string
  url: string
}

const NASA_WEARABLES = {
  source: 'NASA, Wearable Tech for Space Station Research (2024)',
  url: 'https://www.nasa.gov/missions/station/iss-research/wearable-tech-for-space-station-research/',
}
const BIO_MONITOR = {
  source: 'Canadian Space Agency, Bio-Monitor',
  url: 'https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp',
}
const ZWART = {
  source: 'Zwart et al., Body mass changes during long-duration spaceflight, 2014',
  url: 'https://www.ncbi.nlm.nih.gov/pubmed/25197887',
}

/** Flight hardware that already measures the indicator. Self-ratings need none. */
export const IN_FLIGHT: Partial<Record<IndicatorId, FlightNote>> = {
  sleep: { text: 'Wrist actigraph (Actiwatch Spectrum) worn by ISS crews to record sleep length and quality.', ...NASA_WEARABLES },
  restingHR: { text: 'Bio-Monitor smart shirt on the ISS records heart rate continuously, including during sleep.', ...BIO_MONITOR },
  hrv: { text: 'Bio-Monitor smart shirt on the ISS records the heart’s electrical activity, from which variability is computed.', ...BIO_MONITOR },
  bpSys: { text: 'Bio-Monitor on the ISS records blood pressure without interrupting work.', ...BIO_MONITOR },
  bpDia: { text: 'Bio-Monitor on the ISS records blood pressure without interrupting work.', ...BIO_MONITOR },
  spo2: { text: 'Bio-Monitor on the ISS records blood oxygen level.', ...BIO_MONITOR },
  temp: { text: 'ESA’s T-Mini headband sensor tracks core temperature on the ISS; Bio-Monitor records skin temperature.', ...NASA_WEARABLES },
  glucose: {
    text: 'Continuous glucose monitors were worn on the ISS during Axiom Mission 4 in 2025. The sponsors report accuracy similar to Earth; the results are preliminary.',
    source: 'Axiom Space, Suite Ride research release (2025)',
    url: 'https://axiomspace.com/release/suite-ride-research-unlocks-potential-for-first-astronaut-with-diabetes',
  },
  bodyMass: { text: 'Two devices on the ISS measure body mass without gravity: NASA’s SLAMMD and Russia’s BMMD.', ...ZWART },
  exercise: {
    text: 'The Advanced Resistive Exercise Device (ARED) is the main resistive exercise device on the ISS.',
    source: 'NASA Technical Reports Server, ARED load measurement',
    url: 'https://ntrs.nasa.gov/api/citations/20160012791/downloads/20160012791.pdf',
  },
  radiation: { text: 'Personal dosimeters carried by the crew: CSA’s EVARM and ESA’s Active Dosimeter, also flown on Artemis I.', ...NASA_WEARABLES },
  co2: { text: 'Personal CO₂ Monitor: a sensor clipped to clothing, tested on the ISS as a crew-worn and as a fixed monitor.', ...NASA_WEARABLES },
}

/** What was measured in real crews, to put a personal reading in context. */
export const CREW_REFERENCE: Partial<Record<IndicatorId, FlightNote>> = {
  sleep: {
    text: 'ISS crews averaged 6.1 h of sleep a night.',
    source: 'Barger et al., Lancet Neurology 2014',
    url: 'https://doi.org/10.1016/S1474-4422(14)70122-X',
  },
  bodyMass: { text: 'ISS crews lost on average 2.8% (SLAMMD) to 4.4% (BMMD) of their body mass.', ...ZWART },
  radiation: {
    text: 'The Curiosity rover’s RAD instrument measured 1.8 mSv a day on its cruise to Mars.',
    source: 'Zeitlin et al., Science 2013',
    url: 'https://doi.org/10.1126/science.1235989',
  },
}
