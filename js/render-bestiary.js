class RenderBestiary {
	static _getRenderedSection (sectionTrClass, sectionEntries, sectionLevel) {
		const renderer = Renderer.get();
		const renderStack = [];
		if (sectionTrClass === "lairaction" || sectionTrClass === "regionaleffect") {
			renderer.recursiveRender({entries: sectionEntries}, renderStack, {depth: sectionLevel + 2});
		} else if (sectionTrClass === "legendary" || sectionTrClass === "mythic") {
			const cpy = MiscUtil.copy(sectionEntries).map(it => {
				if (it.name && it.entries) {
					it.name = `${it.name}.`;
					it.type = it.type || "item";
				}
				return it;
			});
			const toRender = {type: "list", style: "list-hang-notitle", items: cpy};
			renderer.recursiveRender(toRender, renderStack, {depth: sectionLevel});
		} else {
			sectionEntries.forEach(e => {
				if (e.rendered) renderStack.push(e.rendered);
				else renderer.recursiveRender(e, renderStack, {depth: sectionLevel + 1});
			});
		}
		return `<tr class="${sectionTrClass}"><td colspan="6" class="mon__sect-row-inner">${renderStack.join("")}</td></tr>`;
	}

	static _getPronunciationButton (mon) {
		return `<button class="btn btn-xs btn-default btn-name-pronounce ml-2">
			<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
			<audio class="name-pronounce">
			   <source src="${Renderer.utils.getMediaUrl(mon, "soundClip", "audio")}" type="audio/mpeg">
			</audio>
		</button>`;
	}

	/**
	 * @param {Object} mon Creature data.
	 * @param {Object} options
	 * @param {jQuery} options.$btnScaleCr CR scaler button.
	 * @param {jQuery} options.$btnResetScaleCr CR scaler reset button.
	 */
	static $getRenderedCreature (mon, options) {
		options = options || {};
		const renderer = Renderer.get();
		Renderer.monster.initParsed(mon);

		const allTraits = Renderer.monster.getOrderedTraits(mon, renderer);
		const legGroup = DataUtil.monster.getMetaGroup(mon);

		const renderedVariants = (() => {
			const dragonVariant = Renderer.monster.getDragonCasterVariant(renderer, mon);
			const variants = mon.variant;
			if (!variants && !dragonVariant) return null;
			else {
				const rStack = [];
				(variants || []).forEach(v => renderer.recursiveRender(v, rStack));
				if (dragonVariant) rStack.push(dragonVariant);
				return `<td colspan=6>${rStack.join("")}</td>`;
			}
		})();

		const renderedSources = (() => {
			const srcCpy = {
				source: mon.source,
				sourceSub: mon.sourceSub,
				page: mon.page,
				otherSources: mon.otherSources,
				additionalSources: mon.additionalSources,
				externalSources: mon.externalSources
			};
			const additional = mon.additionalSources ? JSON.parse(JSON.stringify(mon.additionalSources)) : [];
			if (mon.variant && mon.variant.length > 1) {
				mon.variant.forEach(v => {
					if (v.variantSource) {
						additional.push({
							source: v.variantSource.source,
							page: v.variantSource.page
						})
					}
				})
			}
			srcCpy.additionalSources = additional;

			const pageTrInner = Renderer.utils._getPageTrText(srcCpy);
			if (mon.environment && mon.environment.length) {
				return [pageTrInner, `<i>Environment: ${mon.environment.sort(SortUtil.ascSortLower).map(it => it.toTitleCase()).join(", ")}</i>`];
			} else {
				return [pageTrInner];
			}
		})();

		const hasToken = (mon.tokenUrl && mon.uniqueId) || mon.hasToken;
		const extraThClasses = hasToken ? ["mon__name--token"] : null;

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr(mon, "monster", UrlUtil.PG_BESTIARY)}
		${Renderer.utils.getNameTr(mon, {controlRhs: mon.soundClip ? RenderBestiary._getPronunciationButton(mon) : "", extraThClasses, page: UrlUtil.PG_BESTIARY, extensionData: mon._isScaledCr})}
		<tr><td colspan="6">
			<div ${hasToken ? `class="mon__wrp-size-type-align--token"` : ""}><i>${Renderer.monster.getTypeAlignmentPart(mon)}</i></div>
		</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>

		<tr><td colspan="6"><div ${hasToken ? `class="mon__wrp-avoid-token"` : ""}><strong>Armor Class</strong> ${Parser.acToFull(mon.ac)}</div></td></tr>
		<tr><td colspan="6"><div ${hasToken ? `class="mon__wrp-avoid-token"` : ""}><strong>Hit Points</strong> ${Renderer.monster.getRenderedHp(mon.hp)}</div></td></tr>
		<tr><td colspan="6"><strong>Speed</strong> ${Parser.getSpeedString(mon)}</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>

		<tr class="mon__ability-names">
			<th>STR</th><th>DEX</th><th>CON</th><th>INT</th><th>WIS</th><th>CHA</th>
		</tr>
		<tr class="mon__ability-scores">
			${Parser.ABIL_ABVS.map(ab => `<td>${Renderer.utils.getAbilityRoller(mon, ab)}</td>`).join("")}
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>

		${mon.save ? `<tr><td colspan="6"><strong>Saving Throws</strong> ${Renderer.monster.getSavesPart(mon)}</td></tr>` : ""}
		${mon.skill ? `<tr><td colspan="6"><strong>Skills</strong> ${Renderer.monster.getSkillsString(renderer, mon)}</td></tr>` : ""}
		${mon.vulnerable ? `<tr><td colspan="6"><strong>Damage Vulnerabilities</strong> ${Parser.monImmResToFull(mon.vulnerable)}</td></tr>` : ""}
		${mon.resist ? `<tr><td colspan="6"><strong>Damage Resistances</strong> ${Parser.monImmResToFull(mon.resist)}</td></tr>` : ""}
		${mon.immune ? `<tr><td colspan="6"><strong>Damage Immunities</strong> ${Parser.monImmResToFull(mon.immune)}</td></tr>` : ""}
		${mon.conditionImmune ? `<tr><td colspan="6"><strong>Condition Immunities</strong> ${Parser.monCondImmToFull(mon.conditionImmune)}</td></tr>` : ""}
		<tr><td colspan="6"><strong>Senses</strong> ${Renderer.monster.getSensesPart(mon)}</td></tr>
		<tr><td colspan="6"><strong>Languages</strong> ${Renderer.monster.getRenderedLanguages(mon.languages)}</td></tr>

		<tr>${Parser.crToNumber(mon.cr) !== 100 ? $$`
		<td colspan="6" style="position: relative;"><strong>Challenge</strong>
			<span>${Parser.monCrToFull(mon.cr)}</span>
			${options.$btnScaleCr || ""}
			${options.$btnResetScaleCr || ""}
		</td>
		` : ""}</tr>

		${allTraits ? `<tr><td class="divider" colspan="6"><div></div></td></tr>${RenderBestiary._getRenderedSection("trait", allTraits, 1)}` : ""}
		${mon.action ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Actions${mon.actionNote ? ` (<span class="small">${mon.actionNote}</span>)` : ""}</span></td></tr>
		${RenderBestiary._getRenderedSection("action", mon.action, 1)}` : ""}
		${mon.reaction ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Reactions</span></td></tr>
		${RenderBestiary._getRenderedSection("reaction", mon.reaction, 1)}` : ""}
		${mon.legendary ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Legendary Actions</span></td></tr>
		<tr class="legendary"><td colspan="6"><span class="name"></span> <span>${Renderer.monster.getLegendaryActionIntro(mon)}</span></td></tr>
		${RenderBestiary._getRenderedSection("legendary", mon.legendary, 1)}` : ""}
		${mon.mythic ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Mythic Actions</span></td></tr>
		<tr class="mythic"><td colspan="6"><span class="name"></span> <span>${Renderer.monster.getMythicActionIntro(mon)}</span></td></tr>
		${RenderBestiary._getRenderedSection("mythic", mon.mythic, 1)}` : ""}

		${legGroup && legGroup.lairActions ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Lair Actions</span></td></tr>
		${RenderBestiary._getRenderedSection("lairaction", legGroup.lairActions, -1)}` : ""}
		${legGroup && legGroup.regionalEffects ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Regional Effects</span></td></tr>
		${RenderBestiary._getRenderedSection("regionaleffect", legGroup.regionalEffects, -1)}` : ""}

		${renderedVariants ? `<tr>${renderedVariants}</tr>` : ""}
		${mon.footer ? `<tr><td colspan=6 class="mon__sect-row-inner">${renderer.render({entries: mon.footer})}</td></tr>` : ""}
		${renderedSources.length === 2
		? `<tr><td colspan="4">${renderedSources[0]}</td><td colspan="2" class="text-right mr-2">${renderedSources[1]}</td></tr>`
		: `<tr><td colspan="6">${renderedSources[0]}</td></tr>`}
		${Renderer.utils.getBorderTr()}`;
	}
}
