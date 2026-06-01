import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'How long does delivery take?',
    answer: 'Standard delivery within Peninsular Malaysia takes 2-5 business days. East Malaysia may take 5-7 business days. Express delivery is available for next-day delivery in select areas.',
  },
  {
    question: 'What are the shipping costs?',
    answer: 'We offer free shipping on orders over RM100. For orders under RM100, a flat rate of RM8 applies. Express shipping is available at RM15.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards (Visa, Mastercard), online banking (FPX), e-wallets (GrabPay, Touch \'n Go, Boost), and HitPay. All transactions are securely processed.',
  },
  {
    question: 'How do I track my order?',
    answer: 'Once your order is shipped, you will receive an email with a tracking number. You can also track your order by logging into your account and visiting the "My Orders" section.',
  },
  {
    question: 'Can I cancel my order?',
    answer: 'Orders can be cancelled within 1 hour of placement if they have not yet been processed. Please contact our support team immediately if you need to cancel an order.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 7-day return policy for most items. Products must be unused, in original packaging, and in the same condition as received. Some items like personal care products are non-returnable.',
  },
  {
    question: 'How do I request a refund?',
    answer: 'To request a refund, log into your account, go to "My Orders", select the order, and click "Request Return". Our team will review your request within 2 business days.',
  },
  {
    question: 'Do you offer warranty on products?',
    answer: 'Yes, most products come with a manufacturer warranty. The warranty period varies by product and is listed on the product page. Contact us if you need warranty support.',
  },
  {
    question: 'How do I create an account?',
    answer: 'Click the "Register" button at the top of the page and fill in your details. You can also register using your Google account for faster checkout.',
  },
  {
    question: 'I forgot my password. How do I reset it?',
    answer: 'Click "Login" and then "Forgot Password". Enter your email address and we will send you a link to reset your password. The link expires in 1 hour.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-600 mb-8">Find answers to common questions about shopping with HiperCom.</p>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div key={index} className="card overflow-hidden">
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-5 pb-5 text-gray-600 border-t pt-4">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">Still have questions?</p>
        <a href="/contact" className="btn btn-primary">
          Contact Us
        </a>
      </div>
    </div>
  );
}
