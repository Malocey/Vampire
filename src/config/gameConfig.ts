import { PlayerStats, Quest, SkillTree } from "../types";

export const BASE_STATS: PlayerStats = { strength: 8, agility: 8, endurance: 8, intelligence: 8, charisma: 8 };
export const ATTRIBUTE_POINTS_POOL = 10;
export const APPEARANCE_OPTIONS = {
    hairStyle: ['Kurzer Schnitt', 'Zottelig', 'Langer Zopf', 'Glatze'],
    hairColor: ['#000000', '#5c3c1a', '#e6c86e', '#b80000', '#f0f0f0'],
    eyeColor: ['#4a2b16', '#005b8f', '#3c8f3e', '#b3001b', '#8f8f8f'],
    skinTone: ['#f2d4b7', '#d1a881', '#a07d5e', '#6b4c33', '#3d2c1f'],
    clothing: ['Militäruniform', 'Freizeitkleidung'],
};
export const APPEARANCE_LABELS: { [key: string]: string } = {
    hairStyle: 'Haarstil',
    hairColor: 'Haarfarbe',
    eyeColor: 'Augenfarbe',
    skinTone: 'Hautton',
    clothing: 'Kleidung',
};
export const MAIN_QUESTS_DATA: Quest[] = [
    {
        id: 'mq01',
        title: '[Hauptquest] Erwachen',
        description: "Mein Gedächtnis ist eine leere Tafel. Das 'System' auf meinem Arm ist mein einziger Anhaltspunkt. Ich muss die Akademie erkunden und Antworten finden. Jemand hier muss wissen, wer ich bin.",
        objectives: ['Finde jemanden, der dich kennt.'],
        rewards: { xp: 100, item: 'Basis-Medkit', essence: 10 },
        status: 'active',
        type: 'main',
    },
    {
        id: 'mq02',
        title: '[Hauptquest] Die erste Lektion',
        description: "Ein Trainingsplan ist auf meinem Terminal erschienen. Es ist Zeit zu sehen, was diese Akademie von mir erwartet und was ich von mir selbst erwarten kann.",
        objectives: ['Nimm an der geplanten Trainingseinheit teil.', 'Sprich mit dem Ausbilder.'],
        rewards: { xp: 150, item: 'Trainingswaffe (Wahl)', essence: 20 },
        status: 'active',
        type: 'main',
    }
];

export const SKILL_TREE_DATA: SkillTree = {
    // Human Path
    'ath1': { id: 'ath1', name: 'Athletik I', description: 'Erhöht leicht die Bewegungsgeschwindigkeit und Ausweicheffektivität.', type: 'human', tier: 1, cost: { skillPoints: 1 }, prerequisites: [], unlocked: false, position: { x: 50, y: 15 } },
    'tac1': { id: 'tac1', name: 'Taktik I', description: 'Verbessert leicht den Fernkampfschaden und die kritische Trefferchance.', type: 'human', tier: 1, cost: { skillPoints: 1 }, prerequisites: [], unlocked: false, position: { x: 50, y: 50 } },
    'res1': { id: 'res1', name: 'Widerstandsfähigkeit I', description: 'Erhöht leicht die maximalen Lebenspunkte und die Schadensresistenz.', type: 'human', tier: 1, cost: { skillPoints: 1 }, prerequisites: [], unlocked: false, position: { x: 50, y: 85 } },
    'ath2': { id: 'ath2', name: 'Athletik II', description: 'Verbessert die Ausdauerregeneration.', type: 'human', tier: 2, cost: { skillPoints: 2 }, prerequisites: ['ath1'], unlocked: false, position: { x: 50, y: 30 } },
    'tac2': { id: 'tac2', name: 'Taktik II', description: 'Reduziert die Abklingzeiten von Fähigkeiten.', type: 'human', tier: 2, cost: { skillPoints: 2 }, prerequisites: ['tac1'], unlocked: false, position: { x: 50, y: 65 } },
    
    // Nocturne Path (Left)
    'noc_t1_1': { id: 'noc_t1_1', name: 'Schattenschritt', description: 'Eine Teleportation über kurze Distanz in Schatten.', type: 'nocturne', tier: 1, cost: { skillPoints: 1, bloodEssence: 10 }, prerequisites: [], unlocked: false, position: { x: 25, y: 25 } },
    'noc_t1_2': { id: 'noc_t1_2', name: 'Flüsternde Verlockung', description: 'Bezaubert kurz einen Gegner und lässt ihn zögern.', type: 'nocturne', tier: 1, cost: { skillPoints: 1, bloodEssence: 10 }, prerequisites: [], unlocked: false, position: { x: 25, y: 75 } },
    'noc_t2_1': { id: 'noc_t2_1', name: 'Umbrale Fessel', description: 'Ein Schatten-Flächenangriff, der Gegner verlangsamt.', type: 'nocturne', tier: 2, cost: { skillPoints: 2, bloodEssence: 25 }, prerequisites: ['noc_t1_1'], unlocked: false, position: { x: 15, y: 25 } },
    'noc_t2_2': { id: 'noc_t2_2', name: 'Mantel der Nacht', description: 'Werde vorübergehend unsichtbar.', type: 'nocturne', tier: 2, cost: { skillPoints: 2, bloodEssence: 25 }, prerequisites: ['noc_t1_2'], unlocked: false, position: { x: 15, y: 75 } },
    'noc_t3_1': { id: 'noc_t3_1', name: 'Große Schattenmanipulation', description: 'Beschwört einen Schattenvertrauten, der an deiner Seite kämpft.', type: 'nocturne', tier: 3, cost: { skillPoints: 3, bloodEssence: 50 }, prerequisites: ['noc_t2_1'], unlocked: false, position: { x: 5, y: 35 } },
    'noc_ult': { id: 'noc_ult', name: 'Eklipsenblüte', description: 'Ultimativ: Massiver Schatten-Flächenschaden und Schwächungszauber.', type: 'nocturne', tier: 4, cost: { skillPoints: 5, bloodEssence: 100 }, prerequisites: ['noc_t3_1', 'noc_t2_2'], unlocked: false, position: { x: 5, y: 65 } },

    // Sanguine Path (Right)
    'san_t1_1': { id: 'san_t1_1', name: 'Blutgeschoss', description: 'Feuert ein Fernkampfprojektil aus gehärtetem Blut ab.', type: 'sanguine', tier: 1, cost: { skillPoints: 1, bloodEssence: 10 }, prerequisites: [], unlocked: false, position: { x: 75, y: 25 } },
    'san_t1_2': { id: 'san_t1_2', name: 'Sanguinisches Festmahl', description: 'Heile dich selbst, indem du einem Gegner Schaden zufügst.', type: 'sanguine', tier: 1, cost: { skillPoints: 1, bloodEssence: 10 }, prerequisites: [], unlocked: false, position: { x: 75, y: 75 } },
    'san_t2_1': { id: 'san_t2_1', name: 'Dornen-Blutrüstung', description: 'Ein temporärer Verteidigungsbonus, der Schaden reflektiert.', type: 'sanguine', tier: 2, cost: { skillPoints: 2, bloodEssence: 25 }, prerequisites: ['san_t1_1'], unlocked: false, position: { x: 85, y: 25 } },
    'san_t2_2': { id: 'san_t2_2', name: 'Vampirische Stärke', description: 'Ein Ausbruch von Nahkampfschaden mit Lebensraub.', type: 'sanguine', tier: 2, cost: { skillPoints: 2, bloodEssence: 25 }, prerequisites: ['san_t1_2'], unlocked: false, position: { x: 85, y: 75 } },
    'san_t3_1': { id: 'san_t3_1', name: 'Blutgolem-Beschwörung', description: 'Beschwört einen robusten Vertrauten aus Blut.', type: 'sanguine', tier: 3, cost: { skillPoints: 3, bloodEssence: 50 }, prerequisites: ['san_t2_2'], unlocked: false, position: { x: 95, y: 65 } },
    'san_ult': { id: 'san_ult', name: 'Blutsturm-Aufstieg', description: 'Ultimativ: Verwandle dich, um massive Statuswerte und neue Fähigkeiten zu erhalten.', type: 'sanguine', tier: 4, cost: { skillPoints: 5, bloodEssence: 100 }, prerequisites: ['san_t3_1', 'san_t2_1'], unlocked: false, position: { x: 95, y: 35 } },
};