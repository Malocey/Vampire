import React from 'react';
import { PlayerData } from '../../types';

interface InventoryPanelProps {
    playerData: PlayerData;
}

export const InventoryPanel = ({ playerData }: InventoryPanelProps) => {
    const { inventory } = playerData;

    if (!inventory || inventory.length === 0) {
        return (
            <div className="inventory-panel">
                <p>Inventar ist leer.</p>
            </div>
        );
    }

    return (
        <div className="inventory-panel scrollable">
            <ul className="inventory-list">
                {inventory.map(item => (
                    <li key={item.id} className="inventory-item">
                        <div className="item-header">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">x{item.quantity}</span>
                        </div>
                        <p className="item-description">{item.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};