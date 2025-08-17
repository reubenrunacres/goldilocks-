function createHealthHUD(scene, opts={}) {
  const margin = 8, barW = 120, barH = 8, depth = 1000;
  const cam = scene.cameras.main;
  cam.setRoundPixels(true);

  const hud = scene.add.container(0, 0).setScrollFactor(0).setDepth(depth);

  // Champion (left)
  const pLabel = scene.add.text(margin, margin-10, 'CHAMPION', { fontSize: '10px', color: '#e9c46a' }).setScrollFactor(0);
  const pBg    = scene.add.rectangle(margin, margin, barW, barH, 0x000000, 0.35).setOrigin(0,0).setScrollFactor(0);
  const pFill  = scene.add.rectangle(margin+1, margin+1, barW-2, barH-2, 0x2a9d8f).setOrigin(0,0).setScrollFactor(0);

  // Bear (right)
  const rightX = () => Math.round(scene.scale.width - margin - barW);
  const bLabel = scene.add.text(rightX(), margin-10, 'BEAR', { fontSize: '10px', color: '#e76f51' }).setOrigin(0,0).setScrollFactor(0);
  const bBg    = scene.add.rectangle(rightX(), margin, barW, barH, 0x000000, 0.35).setOrigin(0,0).setScrollFactor(0);
  const bFill  = scene.add.rectangle(rightX()+1, margin+1, barW-2, barH-2, 0xe63946).setOrigin(0,0).setScrollFactor(0);

  hud.add([pLabel, pBg, pFill, bLabel, bBg, bFill]);

  function resize() {
    // keep right bar anchored on resize
    const x = rightX();
    bLabel.setX(x);
    bBg.setX(x);
    bFill.setX(x+1);
  }
  scene.scale.on('resize', resize);

  function setBar(fillRect, ratio) {
    ratio = Phaser.Math.Clamp(ratio, 0, 1);
    const targetW = Math.round((barW-2) * ratio);
    scene.tweens.add({ targets: fillRect, width: targetW, duration: 120, ease: 'Linear' });
  }

  const state = { pMax: 1, pCur: 1, bMax: 1, bCur: 1 };
  const api = {
    setPlayer(max, cur) { state.pMax = Math.max(1, max); state.pCur = Math.max(0, cur); setBar(pFill, state.pCur/state.pMax); },
    setBear(max, cur)   { state.bMax = Math.max(1, max); state.bCur = Math.max(0, cur); setBar(bFill, state.bCur/state.bMax); },
    hideOnVictory() { hud.setVisible(false); },
    showOnStart()  { hud.setVisible(true); },
    destroy() { scene.scale.off('resize', resize); hud.destroy(true); }
  };
  return api;
}

// Make it globally available for Phaser
window.createHealthHUD = createHealthHUD;
