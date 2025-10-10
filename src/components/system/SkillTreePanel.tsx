import React, { useState } from 'react';
import { PlayerData, Skill } from '../../types';

interface SkillTreePanelProps {
    playerData: PlayerData;
    onUpdatePlayerData: (data: PlayerData) => void;
}

export const SkillTreePanel = ({ playerData, onUpdatePlayerData }: SkillTreePanelProps) => {
    const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);

    const getSkillStatus = (skill: Skill) => {
        if (skill.unlocked) return 'unlocked';
        const prereqsMet = skill.prerequisites.every(p => playerData.skillTree[p]?.unlocked);
        if (!prereqsMet) return 'locked';
        
        const canAfford = playerData.skillPoints >= skill.cost.skillPoints && 
                         (skill.cost.bloodEssence === undefined || playerData.bloodEssence >= skill.cost.bloodEssence);
        
        return canAfford ? 'available' : 'locked';
    };

    const handleUnlockSkill = (skillId: string) => {
        const skill = playerData.skillTree[skillId];
        const status = getSkillStatus(skill);

        if (status === 'available') {
            const newPlayerData = JSON.parse(JSON.stringify(playerData)); // Deep copy
            newPlayerData.skillTree[skillId].unlocked = true;
            newPlayerData.skillPoints -= skill.cost.skillPoints;
            if (skill.cost.bloodEssence) {
                newPlayerData.bloodEssence -= skill.cost.bloodEssence;
            }
            onUpdatePlayerData(newPlayerData);
        } else if (status === 'locked') {
            console.log("Cannot unlock skill: prerequisites not met or not enough resources.");
        }
    };
    
    const handleResetSkills = () => {
        const resetCost = 250;
        if (playerData.bloodEssence < resetCost) {
            alert(`Nicht genug Blutessenz. Benötigt: ${resetCost}`);
            return;
        }

        if (confirm(`Möchtest du wirklich alle Fähigkeiten für ${resetCost} Blutessenz zurücksetzen? Alle investierten Punkte und Essenzen werden erstattet.`)) {
            let refundedPoints = 0;
            let refundedEssence = 0;
            const newSkillTree = { ...playerData.skillTree };

            Object.values(newSkillTree).forEach(skill => {
                if (skill.unlocked) {
                    refundedPoints += skill.cost.skillPoints;
                    refundedEssence += skill.cost.bloodEssence || 0;
                    newSkillTree[skill.id].unlocked = false;
                }
            });

            onUpdatePlayerData({
                ...playerData,
                skillPoints: playerData.skillPoints + refundedPoints,
                bloodEssence: playerData.bloodEssence + refundedEssence - resetCost,
                skillTree: newSkillTree,
            });
        }
    };

    const tree = Object.values(playerData.skillTree);

    return (
        <div className="skill-tree-panel">
            <div className="skill-tree-header">
                <div className="resource-display">
                    <span>Fähigkeitspunkte: <strong>{playerData.skillPoints}</strong></span>
                    <span>Blutessenz: <strong>{playerData.bloodEssence}</strong></span>
                </div>
                <button onClick={handleResetSkills} className="reset-skills-btn">Fähigkeiten zurücksetzen (250 Essenz)</button>
            </div>
            <div className="skill-tree-container">
                <svg className="skill-lines-svg">
                    {tree.map(skill => 
                        skill.prerequisites.map(prereqId => {
                            const prereq = playerData.skillTree[prereqId];
                            if (!prereq) return null;
                            const isLineActive = skill.unlocked && prereq.unlocked;
                            return (
                                <line
                                    key={`${skill.id}-${prereqId}`}
                                    x1={`${prereq.position.x}%`}
                                    y1={`${prereq.position.y}%`}
                                    x2={`${skill.position.x}%`}
                                    y2={`${skill.position.y}%`}
                                    className={`skill-line ${isLineActive ? 'active' : ''}`}
                                />
                            );
                        })
                    )}
                </svg>
                {tree.map(skill => (
                    <div
                        key={skill.id}
                        className={`skill-node ${skill.type} ${getSkillStatus(skill)}`}
                        style={{ left: `${skill.position.x}%`, top: `${skill.position.y}%` }}
                        onMouseEnter={() => setHoveredSkill(skill)}
                        onMouseLeave={() => setHoveredSkill(null)}
                        onClick={() => handleUnlockSkill(skill.id)}
                    >
                    </div>
                ))}
            </div>
            {hoveredSkill && (
                <div className="skill-tooltip">
                    <h4>{hoveredSkill.name}</h4>
                    <p>{hoveredSkill.description}</p>
                    <div className="tooltip-cost">
                        <p>Kosten:</p>
                        <span>{hoveredSkill.cost.skillPoints} Fähigkeitspunkte</span>
                        {hoveredSkill.cost.bloodEssence && <span>{hoveredSkill.cost.bloodEssence} Blutessenz</span>}
                    </div>
                </div>
            )}
        </div>
    );
};
