# Validation of the correlation engine

The engine in `src/core/insights.ts` tells an astronaut which of their logged behaviours go together with better or worse recovery. A tool like this is easy to build and easy to get wrong: with 12 behaviours and 6 outcomes it makes about 70 comparisons per person, and chance alone will make some of them look like effects.

The demo mission cannot answer whether the engine works, because that data was written to tell a story. So the engine is tested on generated data where the truth is known: we decide which effects exist and how large they are, and count what the engine reports. The tests are in `src/core/validation.test.ts` and run with `npm test`. Each number below comes from 400 simulated astronauts with 120 days of data.

## What we found in the first version

The first version reported every pair with an effect size of Cohen's d ≥ 0.5 and at least 5 days in each group.

| Test | First version |
|---|---|
| Data with **no real effects at all**: false patterns shown per astronaut | **3.1** (95% of astronauts saw at least one) |
| A behaviour with no effect that happens on 80% of the days of a behaviour with a real effect: blamed | **47%** of astronauts |

Both are failures. Three invented patterns per person would teach the crew to ignore the screen.

## What was changed

1. **Significance.** Each difference is tested with Welch's t-test, which does not assume equal group sizes or equal spread.
2. **Correction for many comparisons.** The p-values of all tested pairs go through the Benjamini–Hochberg procedure with a false discovery rate of 10%.
3. **Effect size.** A pattern must still be at least moderate (d ≥ 0.5), so that it is worth acting on.
4. **Confounding.** Behaviours come in bundles: a shifted schedule brings late caffeine and sleep aids with it. Each surviving pair is re-checked in a multiple regression with all behaviours at once. If the effect disappears or changes direction there, the pair is dropped. The remaining effect is shown to the user next to the plain difference.

## Results after the change

| Test | First version | Now |
|---|---|---|
| No real effects: false patterns per astronaut | 3.1 | **0.13** |
| No real effects: astronauts shown at least one false pattern | 95% | **11%** |
| Passenger behaviour blamed for another behaviour's effect | 47% | **2%** |
| Real cause still found in that test | 94% | 90% |
| Reported effect in the wrong direction | ≤ 1.5% | **0%** |

Detection of a real effect within 120 days, for a behaviour logged on 20% of days:

| True effect size (d) | Found |
|---|---|
| 0.3 (weak) | 2% |
| 0.5 (moderate) | 14% |
| 0.8 (strong) | 55% |
| 1.2 (very strong) | 93% |

For a rare behaviour (6% of days, about 7 days in 120) even a very strong effect is found only 22% of the time.

This is the price of the correction and it is deliberate: the engine now stays silent about weak effects instead of guessing. More days of data raise these figures.

## Check on the demo mission

The demo data has effects built into its generator (`src/core/mission.ts`), so the regression-adjusted estimates can be compared with the values that were put in. Flight engineer, day 120:

| Behaviour → outcome | Built in | Plain difference | Adjusted estimate |
|---|---|---|---|
| Shifted sleep schedule → sleep | −1.6 h | −1.9 h | −1.6 h |
| Late caffeine → sleep | −0.6 h | −1.0 h | −0.5 h |
| High workload → stress | +1.2 pt | +1.1 pt | +1.0 pt |
| Private time → stress | −0.5 pt | −0.6 pt | −0.5 pt |
| Contact with home → mood | +0.5 pt | +0.7 pt | +0.8 pt |
| Low appetite → energy | −0.4 pt | −0.5 pt | −0.5 pt |

The first version also reported "took a sleep aid → stress +1.3 pt". Nothing in the generator links the two; sleep aids were simply taken during the high-stress schedule shift. The regression check removes it.

## What this does not show

- All of this is synthetic data. The engine has not been run on real astronaut data, and the tests show that the statistics behave as intended, not that the patterns are medically meaningful.
- A correlation that survives these checks is still not proof of cause. A cause that is never logged cannot be accounted for.
- The t-test and the regression treat days as independent. Day-to-day carry-over in the outcome (tested up to an autocorrelation of 0.5) did not raise the false-pattern rate, but behaviours that cluster in long blocks can.
- Mood, energy and stress are 1–5 ratings and are treated as numbers.

## References

- Welch BL. The generalization of "Student's" problem when several different population variances are involved. Biometrika. 1947;34(1–2):28–35.
- Benjamini Y, Hochberg Y. Controlling the false discovery rate: a practical and powerful approach to multiple testing. J R Stat Soc B. 1995;57(1):289–300.
- Cohen J. Statistical Power Analysis for the Behavioral Sciences. 2nd ed. 1988.
