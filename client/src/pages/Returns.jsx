import { Link } from 'react-router-dom';

export default function Returns() {
  return (
    <div className="max-w-3xl mx-auto prose prose-gray">
      <h1 className="text-3xl font-bold mb-6">Returns &amp; Refunds Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: January 2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7-Day Return Policy</h2>
        <p className="text-gray-600 leading-relaxed">
          We want you to be completely satisfied with your purchase. If you are not satisfied, you may return most items within 7 days of delivery for a refund or exchange, subject to the conditions below.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Eligibility for Returns</h2>
        <p className="text-gray-600 leading-relaxed">To be eligible for a return, the item must be:</p>
        <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
          <li>Unused and in the same condition as received</li>
          <li>In its original packaging with all tags attached</li>
          <li>Accompanied by the original receipt or proof of purchase</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Non-Returnable Items</h2>
        <p className="text-gray-600 leading-relaxed">The following items cannot be returned:</p>
        <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
          <li>Personal care and hygiene products</li>
          <li>Perishable goods (food and beverages)</li>
          <li>Gift cards</li>
          <li>Items marked as "Final Sale" or "Clearance"</li>
          <li>Customized or personalized products</li>
          <li>Software and digital downloads once activated</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How to Initiate a Return</h2>
        <ol className="list-decimal list-inside text-gray-600 mt-2 space-y-2">
          <li>Log into your account and go to "My Orders"</li>
          <li>Select the order containing the item you wish to return</li>
          <li>Click "Request Return" and select the reason</li>
          <li>Our team will review your request within 2 business days</li>
          <li>If approved, you will receive return instructions and a return shipping label</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Refund Process</h2>
        <p className="text-gray-600 leading-relaxed">
          Once we receive and inspect your returned item, we will notify you of the approval or rejection of your refund. Approved refunds will be processed within 5-7 business days and credited to your original payment method.
        </p>
        <p className="text-gray-600 leading-relaxed mt-2">
          If you haven't received your refund within 10 business days, please check your bank account again, then contact your bank or payment provider. If you still have not received your refund, please contact us.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Exchanges</h2>
        <p className="text-gray-600 leading-relaxed">
          We only replace items if they are defective or damaged. If you need to exchange an item for the same product, send us an email at info@hipercom.com.my with your order number and details.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Return Shipping</h2>
        <p className="text-gray-600 leading-relaxed">
          Return shipping costs are the responsibility of the customer unless the item is defective or we made an error. We recommend using a trackable shipping service for returns. We are not responsible for returns lost in transit.
        </p>
      </section>

      <div className="mt-12 p-6 bg-gray-50 rounded-xl">
        <p className="text-gray-600 mb-4">Need help with a return?</p>
        <div className="flex gap-4">
          <Link to="/contact" className="btn btn-primary">Contact Us</Link>
          <Link to="/orders" className="btn btn-outline">View My Orders</Link>
        </div>
      </div>
    </div>
  );
}
