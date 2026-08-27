import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SimpleFAQ {
  question: string;
  answer: string;
}

export function FAQAccordion({ faqs }: { faqs: SimpleFAQ[] }) {
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
