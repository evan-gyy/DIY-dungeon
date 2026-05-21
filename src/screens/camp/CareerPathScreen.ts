// ============================================================
//  src/screens/camp/CareerPathScreen.ts — 职业路线选择
// ============================================================
//  玩家首次进入任务/朝廷面板时必须选择文官+江湖 或 武官+江湖
//  一旦选定不可更改——两条路线决定了朝廷任务池与属性侧重
// ============================================================

import { getPlayer, setPlayer } from '../../state/GameState';
import { saveGame } from '../../state/SaveSystem';
import { showToast } from '../../ui/toast';

export function showCareerPathScreen(onChosen?: () => void): void {
  const existing = document.getElementById('career-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'career-overlay';
  overlay.className = 'career-overlay';

  overlay.innerHTML = `
    <div class="career-dialog">
      <div class="career-title">⚖️ 选择你的江湖之路</div>
      <div class="career-subtitle">江湖是所有人的底色，庙堂才是你的分野</div>
      <div class="career-warning">⚠️ 一旦选定路线，终身从之，不可更改</div>

      <div class="career-cards">
        <div class="career-card career-card-wen" id="career-card-wen">
          <div class="career-card-icon">📜</div>
          <div class="career-card-name">文官 · 江湖</div>
          <div class="career-card-path">治世能臣 · 运筹帷幄</div>
          <div class="career-card-stats">
            <span class="career-stat-tag">★ 口才</span>
            <span class="career-stat-tag">★ 学识</span>
          </div>
          <div class="career-card-rank">朝廷品阶：秀才 → 举人 → 进士 → 翰林 → 尚书 → 宰相</div>
          <div class="career-card-desc">
            以智谋安天下，以外交平四方<br>
            侧重外交谈判、政务调查、传功立说<br>
            在这条路上，舌灿莲花比刀光剑影更为致命
          </div>
          <button class="btn career-choose-btn" data-career="wen">📜 选择文官之路</button>
        </div>

        <div class="career-card career-card-wu" id="career-card-wu">
          <div class="career-card-icon">⚔️</div>
          <div class="career-card-name">武官 · 江湖</div>
          <div class="career-card-path">沙场猛将 · 一骑当千</div>
          <div class="career-card-stats">
            <span class="career-stat-tag">★ 智谋</span>
            <span class="career-stat-tag">★ 魅力</span>
          </div>
          <div class="career-card-rank">朝廷品阶：校尉 → 都尉 → 将军 → 大将军</div>
          <div class="career-card-desc">
            以战功镇天下，以军威慑四方<br>
            侧重战斗征讨、护送押运、平叛剿匪<br>
            在这条路上，金戈铁马是你们最好的名片
          </div>
          <button class="btn career-choose-btn" data-career="wu">⚔️ 选择武官之路</button>
        </div>
      </div>

      <div class="career-note">
        无论选择哪条路线，江湖宗门任务、战斗探索皆为两路共通<br>
        区别在于朝廷侧的主线方向与晋升标准
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 绑定选择事件
  overlay.querySelectorAll<HTMLButtonElement>('.career-choose-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const career = btn.dataset['career'] as 'wen' | 'wu';
      const p = getPlayer();
      const updated = { ...p, playerCareer: career, courtPath: career };
      setPlayer(updated);
      saveGame(updated);

      const label = career === 'wen' ? '文官·江湖' : '武官·江湖';
      showToast(`🎯 已选择「${label}」之路——此路漫漫，莫忘初心`);

      overlay.remove();
      onChosen?.();
    });
  });

  // 点击背景关闭（不允许——必须选择）
  // 没有关闭按钮，强制玩家必须二选一
}
