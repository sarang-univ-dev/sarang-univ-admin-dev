"use client";

import { useIsMobile } from "@/hooks/use-media-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { PageHelpContent, HelpSection, BadgeHelpContent } from "@/lib/help/types";
import {
  HelpExampleRenderer,
  HelpSingleExample,
} from "./HelpExampleRenderer";

interface PageHelpPanelProps {
  content: PageHelpContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 페이지 도움말 패널 컴포넌트
 *
 * @description
 * - 데스크톱: Dialog
 * - 모바일: 전체화면 Sheet
 * - Accordion으로 섹션 콘텐츠 렌더링
 */
export function PageHelpPanel({
  content,
  open,
  onOpenChange,
}: PageHelpPanelProps) {
  const isMobile = useIsMobile();

  // 섹션 콘텐츠 렌더링
  const renderSectionContent = () => (
    <Accordion type="multiple" className="w-full" defaultValue={["overview"]}>
      {content.sections.map((section: HelpSection) => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger className="text-sm font-medium">
            {section.title}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
              {section.items && section.items.length > 0 && (
                <ul className="space-y-3">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="text-sm">
                      <div>
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          - {item.description}
                        </span>
                      </div>
                      {/* 컴포넌트 예시 렌더링 */}
                      {item.examples && item.examples.length > 0 && (
                        <div className="mt-2 pl-2 py-2 bg-muted/30 rounded-md">
                          <HelpExampleRenderer
                            examples={item.examples}
                            direction="horizontal"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}

      {/* 상태 뱃지 섹션 */}
      {content.badges && Object.keys(content.badges).length > 0 && (
        <AccordionItem value="badges">
          <AccordionTrigger className="text-sm font-medium">
            상태 표시 안내
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {Object.entries(content.badges).map(([category, badges]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category === "paymentStatus"
                      ? "입금 상태"
                      : category === "attendance"
                        ? "참석 현황"
                        : category === "shuttleBus"
                          ? "셔틀버스"
                          : category}
                  </h4>
                  <ul className="space-y-2">
                    {badges.map((badge: BadgeHelpContent, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm p-2 rounded-md bg-muted/20"
                      >
                        {/* 뱃지 프리뷰 */}
                        {badge.preview && (
                          <div className="flex-shrink-0 pt-0.5">
                            <HelpSingleExample example={badge.preview} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{badge.title}</div>
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {badge.description}
                          </p>
                          {badge.action && (
                            <p className="text-xs text-primary mt-1">
                              {badge.action}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* FAQ 섹션 */}
      {content.faqs && content.faqs.length > 0 && (
        <AccordionItem value="faqs">
          <AccordionTrigger className="text-sm font-medium">
            자주 묻는 질문
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {content.faqs.map((faq, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-sm font-medium">Q. {faq.question}</p>
                  <p className="text-sm text-muted-foreground pl-4">
                    A. {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );

  // 모바일: 전체화면 Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex h-[90vh] flex-col overflow-hidden">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle>{content.title}</SheetTitle>
            <SheetDescription>{content.description}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1 pr-4">
            <div className="py-4">{renderSectionContent()}</div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pr-8">
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1 pr-4">
          <div className="py-4">{renderSectionContent()}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
