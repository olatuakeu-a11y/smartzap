'use client'

import React from 'react'
import {
  ButtonType,
  ButtonCounts,
  Flow,
  Spec,
  PANEL_CLASS,
  PANEL_PADDING,
  AddButtonDropdown,
  QuickReplyButtonList,
  CTAButtonList,
  AdvancedPanel,
} from './buttons'

export interface StepButtonsProps {
  spec: Spec
  buttons: any[]
  updateButtons: (buttons: any[]) => void
  addButton: (type: ButtonType) => void
  canAddButtonType: (type: ButtonType) => { ok: boolean; reason?: string }
  publishedFlows: Flow[]
  flowsQueryIsLoading: boolean
  isMarketingCategory: boolean
  isLimitedTimeOffer: boolean
  allowedButtonTypes: Set<ButtonType>
  counts: ButtonCounts
  maxButtonText: number
  maxButtons: number
  buttonErrors: string[]
  carouselErrors: string[]
  limitedTimeOfferTextMissing: boolean
  limitedTimeOfferTextTooLong: boolean
  limitedTimeOfferCategoryInvalid: boolean
  // LTO panel
  header: any
  update: (patch: Partial<Spec>) => void
  // Utilities
  clampText: (value: string, max: number) => string
  countChars: (value: unknown) => number
  splitPhone: (phone: string) => { country: string; number: string }
  joinPhone: (country: string, number: string) => string
}

export function StepButtons({
  spec,
  buttons,
  updateButtons,
  addButton,
  canAddButtonType,
  publishedFlows,
  flowsQueryIsLoading,
  isLimitedTimeOffer,
  allowedButtonTypes,
  counts,
  maxButtonText,
  maxButtons,
  buttonErrors,
  carouselErrors,
  limitedTimeOfferTextMissing,
  limitedTimeOfferTextTooLong,
  limitedTimeOfferCategoryInvalid,
  header,
  update,
  clampText,
  countChars,
  splitPhone,
  joinPhone,
}: StepButtonsProps) {
  const hasButtons = buttons.length > 0
  const hasQuickReplies = buttons.some((b) => b?.type === 'QUICK_REPLY')
  const hasCTAButtons = buttons.some((b) => b?.type !== 'QUICK_REPLY')
  const isAtMaxButtons = counts.total >= maxButtons

  return (
    <>
      {/* Main Buttons Panel */}
      <div className={`${PANEL_CLASS} ${PANEL_PADDING} space-y-4`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">
              Botoes <span className="text-xs text-gray-500 font-normal">* Opcional</span>
            </div>
            <div className="text-xs text-gray-400">
              E possivel adicionar ate 10 botoes. Se adicionar mais de 3, eles aparecem em lista.
            </div>
          </div>
          <AddButtonDropdown addButton={addButton} canAddButtonType={canAddButtonType} />
        </div>

        {/* Button Lists */}
        {!hasButtons ? (
          <div className="text-sm text-gray-500">Nenhum botao</div>
        ) : (
          <div className="space-y-5">
            {hasQuickReplies && (
              <QuickReplyButtonList
                buttons={buttons}
                updateButtons={updateButtons}
                maxButtonText={maxButtonText}
                clampText={clampText}
                countChars={countChars}
              />
            )}

            {hasCTAButtons && (
              <CTAButtonList
                buttons={buttons}
                updateButtons={updateButtons}
                allowedButtonTypes={allowedButtonTypes}
                maxButtonText={maxButtonText}
                clampText={clampText}
                countChars={countChars}
                splitPhone={splitPhone}
                joinPhone={joinPhone}
                publishedFlows={publishedFlows}
                flowsQueryIsLoading={flowsQueryIsLoading}
                isLimitedTimeOffer={isLimitedTimeOffer}
              />
            )}
          </div>
        )}

        {/* Validation Messages */}
        {isAtMaxButtons && (
          <div className="text-xs text-amber-300">
            Voce ja atingiu o limite de {maxButtons} botoes.
          </div>
        )}

        {buttonErrors.length > 0 && (
          <div className="text-xs text-amber-300 space-y-1">
            {buttonErrors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Panel */}
      <AdvancedPanel
        spec={spec}
        header={header}
        update={update}
        carouselErrors={carouselErrors}
        limitedTimeOfferTextMissing={limitedTimeOfferTextMissing}
        limitedTimeOfferTextTooLong={limitedTimeOfferTextTooLong}
        limitedTimeOfferCategoryInvalid={limitedTimeOfferCategoryInvalid}
      />
    </>
  )
}
