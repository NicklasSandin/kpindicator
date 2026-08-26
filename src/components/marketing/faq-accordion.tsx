import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQ } from "@/content/faqs";

export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={faq.question} value={`item-${i}`}>
          <AccordionTrigger className="text-left text-[15px] font-medium text-foreground">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-[15px] text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
