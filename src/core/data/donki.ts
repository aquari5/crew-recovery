// Real records from NASA's Space Weather Database Of Notifications, Knowledge,
// Information (DONKI), solar energetic particle (SEP) events, exactly as returned by
//   https://api.nasa.gov/DONKI/SEP?startDate=...&endDate=...
// on 15 Nov 2026, with fields the app does not use removed. Source and terms:
// https://ccmc.gsfc.nasa.gov/tools/DONKI/ (NASA Community Coordinated Modeling Center).

import type { DonkiSep } from '../spaceWeather'

/** 3–13 September 2017: X9.3 and X8.2 flares; the 10 September event reached ground level. */
export const SEP_2017_09: DonkiSep[] = [
  {
    "sepID": "2017-09-04T22:56:00-SEP-001",
    "eventTime": "2017-09-04T22:56Z",
    "instruments": [
      {
        "displayName": "MODEL: REleASE:SOHO/EPHIN 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13004/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-04T20:15:00-FLR-001"
      },
      {
        "activityID": "2017-09-04T20:36:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-04T23:52:00-SEP-001",
    "eventTime": "2017-09-04T23:52Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13000/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-04T20:15:00-FLR-001"
      },
      {
        "activityID": "2017-09-04T20:36:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-05T00:30:00-SEP-001",
    "eventTime": "2017-09-05T00:30Z",
    "instruments": [
      {
        "displayName": "GOES13: SEM/EPS >10 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/12984/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-04T20:15:00-FLR-001"
      },
      {
        "activityID": "2017-09-04T20:36:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-06T23:30:00-SEP-001",
    "eventTime": "2017-09-06T23:30Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13081/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-06T11:53:00-FLR-001"
      },
      {
        "activityID": "2017-09-06T12:24:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-06T23:45:00-SEP-001",
    "eventTime": "2017-09-06T23:45Z",
    "instruments": [
      {
        "displayName": "GOES13: SEM/EPS >10 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13036/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-04T19:39:00-CME-001"
      },
      {
        "activityID": "2017-09-04T20:15:00-FLR-001"
      },
      {
        "activityID": "2017-09-04T20:36:00-CME-001"
      },
      {
        "activityID": "2017-09-06T23:08:00-IPS-001"
      }
    ]
  },
  {
    "sepID": "2017-09-10T16:25:00-SEP-001",
    "eventTime": "2017-09-10T16:25Z",
    "instruments": [
      {
        "displayName": "GOES13: SEM/EPS >100 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13101/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-10T15:35:00-FLR-001"
      },
      {
        "activityID": "2017-09-10T16:09:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-10T16:45:00-SEP-001",
    "eventTime": "2017-09-10T16:45Z",
    "instruments": [
      {
        "displayName": "GOES13: SEM/EPS >10 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13104/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-10T15:35:00-FLR-001"
      },
      {
        "activityID": "2017-09-10T16:09:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-10T20:00:00-SEP-001",
    "eventTime": "2017-09-10T20:00Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13112/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-10T15:35:00-FLR-001"
      },
      {
        "activityID": "2017-09-10T16:09:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2017-09-13T05:33:00-SEP-001",
    "eventTime": "2017-09-13T05:33Z",
    "instruments": [
      {
        "displayName": "STEREO A: IMPACT 13-100 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/13134/-1",
    "linkedEvents": [
      {
        "activityID": "2017-09-10T16:09:00-CME-001"
      },
      {
        "activityID": "2017-09-12T07:23:00-FLR-001"
      },
      {
        "activityID": "2017-09-12T19:03:00-FLR-001"
      }
    ]
  }
]

/** 6–16 May 2024: the storm behind the strongest geomagnetic activity in two decades. */
export const SEP_2024_05: DonkiSep[] = [
  {
    "sepID": "2024-05-09T13:59:00-SEP-001",
    "eventTime": "2024-05-09T13:59Z",
    "instruments": [
      {
        "displayName": "MODEL: REleASE:ACE/EPAM 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30609/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-09T08:45:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-09T14:25:00-SEP-001",
    "eventTime": "2024-05-09T14:25Z",
    "instruments": [
      {
        "displayName": "MODEL: REleASE:SOHO/EPHIN 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30610/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-09T08:45:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-10T12:59:00-SEP-001",
    "eventTime": "2024-05-10T12:59Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30675/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-09T08:45:00-FLR-001"
      },
      {
        "activityID": "2024-05-09T17:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-10T06:27:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-10T13:02:00-SEP-001",
    "eventTime": "2024-05-10T13:02Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 28.2-50.1 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30676/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-09T08:45:00-FLR-001"
      },
      {
        "activityID": "2024-05-09T17:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-10T06:27:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-10T13:35:00-SEP-001",
    "eventTime": "2024-05-10T13:35Z",
    "instruments": [
      {
        "displayName": "GOES-P: SEISS >10 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30677/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-08T04:20:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T04:37:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T05:36:00-CME-001"
      },
      {
        "activityID": "2024-05-08T11:26:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T12:24:00-CME-001"
      },
      {
        "activityID": "2024-05-08T21:08:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T22:05:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T22:24:00-CME-001"
      },
      {
        "activityID": "2024-05-09T08:45:00-FLR-001"
      },
      {
        "activityID": "2024-05-09T09:24:00-CME-001"
      },
      {
        "activityID": "2024-05-09T17:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-09T18:23:00-CME-001"
      },
      {
        "activityID": "2024-05-10T06:27:00-FLR-001"
      },
      {
        "activityID": "2024-05-10T07:12:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2024-05-10T14:50:00-SEP-001",
    "eventTime": "2024-05-10T14:50Z",
    "instruments": [
      {
        "displayName": "STEREO A: IMPACT 13-100 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30684/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-08T04:20:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T04:37:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T11:26:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T12:24:00-CME-001"
      },
      {
        "activityID": "2024-05-08T21:08:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T22:05:00-FLR-001"
      },
      {
        "activityID": "2024-05-08T22:24:00-CME-001"
      },
      {
        "activityID": "2024-05-09T08:45:00-FLR-001"
      },
      {
        "activityID": "2024-05-09T09:24:00-CME-001"
      },
      {
        "activityID": "2024-05-09T17:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-09T18:23:00-CME-001"
      },
      {
        "activityID": "2024-05-10T06:27:00-FLR-001"
      },
      {
        "activityID": "2024-05-10T07:12:00-CME-001"
      },
      {
        "activityID": "2024-05-10T13:58:00-FLR-001"
      },
      {
        "activityID": "2024-05-10T14:00:00-IPS-001"
      }
    ]
  },
  {
    "sepID": "2024-05-11T02:10:00-SEP-001",
    "eventTime": "2024-05-11T02:10Z",
    "instruments": [
      {
        "displayName": "GOES-P: SEISS >100 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30714/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-11T01:10:00-FLR-001"
      },
      {
        "activityID": "2024-05-11T01:36:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2024-05-11T04:07:00-SEP-001",
    "eventTime": "2024-05-11T04:07Z",
    "instruments": [
      {
        "displayName": "STEREO A: IMPACT 13-100 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30717/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-11T01:10:00-FLR-001"
      },
      {
        "activityID": "2024-05-11T01:36:00-CME-001"
      }
    ]
  },
  {
    "sepID": "2024-05-13T12:44:00-SEP-001",
    "eventTime": "2024-05-13T12:44Z",
    "instruments": [
      {
        "displayName": "STEREO A: IMPACT 13-100 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30811/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-13T08:06:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:47:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T09:12:00-CME-001"
      },
      {
        "activityID": "2024-05-13T09:36:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-13T13:10:00-SEP-001",
    "eventTime": "2024-05-13T13:10Z",
    "instruments": [
      {
        "displayName": "MODEL: REleASE:SOHO/EPHIN 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30807/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-13T08:06:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:47:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T09:12:00-CME-001"
      },
      {
        "activityID": "2024-05-13T09:36:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-13T14:00:00-SEP-001",
    "eventTime": "2024-05-13T14:00Z",
    "instruments": [
      {
        "displayName": "GOES-P: SEISS >10 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30817/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-13T08:06:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:47:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T09:12:00-CME-001"
      },
      {
        "activityID": "2024-05-13T09:36:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-13T16:19:00-SEP-001",
    "eventTime": "2024-05-13T16:19Z",
    "instruments": [
      {
        "displayName": "MODEL: REleASE:ACE/EPAM 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30820/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-13T08:06:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:47:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T09:12:00-CME-001"
      },
      {
        "activityID": "2024-05-13T09:36:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-13T18:07:00-SEP-001",
    "eventTime": "2024-05-13T18:07Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 15.8-39.8 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30824/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-13T08:06:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:47:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T09:12:00-CME-001"
      },
      {
        "activityID": "2024-05-13T09:36:00-FLR-001"
      }
    ]
  },
  {
    "sepID": "2024-05-13T18:07:00-SEP-002",
    "eventTime": "2024-05-13T18:07Z",
    "instruments": [
      {
        "displayName": "SOHO: COSTEP 28.2-50.1 MeV"
      }
    ],
    "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/30825/-1",
    "linkedEvents": [
      {
        "activityID": "2024-05-13T08:06:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:23:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T08:47:00-FLR-001"
      },
      {
        "activityID": "2024-05-13T09:12:00-CME-001"
      },
      {
        "activityID": "2024-05-13T09:36:00-FLR-001"
      }
    ]
  }
]

/** What the live feed returned when this file was written: no events from 1 Oct to 15 Nov 2026. */
export const SNAPSHOT = { from: '2026-10-01', to: '2026-11-15', events: [] as DonkiSep[] }
