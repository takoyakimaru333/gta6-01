// Story of Solara Bay: Kai Mercer, a broke boat mechanic, owes the Rios family.
// Fixer Lena Voss offers work. Six chained missions plus free-roam side jobs.
// Each mission is data: intro text, objective steps with a target and a check name the
// main loop resolves, a payout, and the wanted level the job stirs up.
export const MISSIONS = [
  { id: 'meet', title: 'First Coffee', giver: 'Lena Voss',
    intro: 'Lena: "Kai. You owe the Rios family 40 grand. Meet me at Cafe Alba - I have work that pays."',
    steps: [{ type: 'goto', x: 560, y: 480, label: 'Meet Lena at Cafe Alba', radius: 60 }],
    payout: 100, wanted: 0, rewardText: 'Lena slips you $100 and a Harbor Pistol.' },
  { id: 'wheels', title: 'Borrowed Wheels', giver: 'Lena Voss',
    intro: 'Lena: "A Palma Coupe near Aurelia Tower is unlocked. Take it. Deliver it to Rios Garage, clean."',
    steps: [
      { type: 'stealModel', model: 'Palma Coupe', label: 'Steal a Palma Coupe (marked, near Aurelia Tower)', radius: 0 },
      { type: 'gotoCar', x: 1620, y: 1020, label: 'Deliver the car to Rios Garage', radius: 78 }],
    payout: 450, wanted: 1, rewardText: 'The garage crew nods. The debt shrinks.' },
  { id: 'package', title: 'Hot Package', giver: 'Lena Voss',
    intro: 'Lena: "Pick up the case at the Canal Warehouse. Drop it at Bay Clinic in 150 seconds. Do not stop."',
    steps: [
      { type: 'goto', x: 430, y: 1980, label: 'Pick up the case at Canal Warehouse', radius: 58 },
      { type: 'gotoTimed', x: 2660, y: 1480, label: 'Deliver to Bay Clinic - hurry!', radius: 66, time: 150 }],
    payout: 700, wanted: 2, rewardText: 'A nurse takes the case without a word. $700, no questions.' },
  { id: 'guards', title: 'Warehouse Debts', giver: 'Rios Family',
    intro: 'Rios: "Three of Varga\'s guards are counting our money at the Canal Warehouse. End the count."',
    steps: [{ type: 'eliminate', count: 3, x: 430, y: 1980, label: 'Eliminate Varga\'s 3 guards at the warehouse', radius: 300 }],
    payout: 900, wanted: 2, rewardText: 'The warehouse goes quiet. You earn the Canal SMG.' },
  { id: 'escape', title: 'Sirens at Dusk', giver: 'Lena Voss',
    intro: 'Lena: "The job went loud. Lose the police and reach the Hilltop Hideout. Stay out of sight to cool down."',
    steps: [{ type: 'escape', x: 3220, y: 420, label: 'Lose the heat, then reach Hilltop Hideout', radius: 80 }],
    payout: 800, wanted: 3, rewardText: 'From the hilltop, Solara Bay glitters - and owes you nothing tonight.' },
  { id: 'pier', title: 'The Last Tide', giver: 'Lena Voss',
    intro: 'Lena: "Final run. Take the Aurelia GT at the Tower, reach Solara Pier in 120 seconds, and sail out free."',
    steps: [
      { type: 'stealModel', model: 'Aurelia GT', label: 'Steal the Aurelia GT (marked, at Aurelia Tower)', radius: 0 },
      { type: 'gotoCarTimed', x: 1800, y: 2440, label: 'Reach Solara Pier before the tide turns!', radius: 90, time: 120 }],
    payout: 2500, wanted: 3, rewardText: 'Debt paid. The boat, the bay, and the sunrise are yours. STORY COMPLETE - free roam!' },
];
export function missionByIndex(i) { return MISSIONS[i] || null; }
export function sideJobText() {
  return 'Free roam: steal cars for cash at Rios Garage, find 10 data chips, or stir up the bay your way.';
}
