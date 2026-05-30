import { Link } from 'react-router-dom';
import { Store, Truck, Shield, Headphones, Mail, Phone, MapPin } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">About HiperCom</h1>
        <p className="text-xl text-gray-600">Your trusted online shopping destination in Malaysia</p>
      </div>

      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">Our Story</h2>
        <p className="text-gray-600 mb-4">
          HiperCom Technology Sdn Bhd was founded with a simple mission: to provide Malaysians with a seamless, 
          reliable, and enjoyable online shopping experience. We believe that everyone deserves access to 
          quality products at fair prices, delivered with care and speed.
        </p>
        <p className="text-gray-600">
          From our humble beginnings, we've grown into a trusted e-commerce platform serving thousands of 
          customers across Malaysia. Our commitment to customer satisfaction drives everything we do.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="card p-6 text-center">
          <Store className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Wide Selection</h3>
          <p className="text-gray-600 text-sm">Thousands of products across multiple categories</p>
        </div>
        <div className="card p-6 text-center">
          <Truck className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Fast Delivery</h3>
          <p className="text-gray-600 text-sm">Nationwide shipping with tracking</p>
        </div>
        <div className="card p-6 text-center">
          <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Secure Shopping</h3>
          <p className="text-gray-600 text-sm">Safe payments and buyer protection</p>
        </div>
      </div>

      <div className="card p-8">
        <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <Mail className="h-6 w-6 text-primary-600 mt-1" />
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-gray-600 text-sm">info@hipercom.com.my</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="h-6 w-6 text-primary-600 mt-1" />
            <div>
              <h3 className="font-medium">Phone</h3>
              <p className="text-gray-600 text-sm">+60 3-1234 5678</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-6 w-6 text-primary-600 mt-1" />
            <div>
              <h3 className="font-medium">Address</h3>
              <p className="text-gray-600 text-sm">Kuala Lumpur, Malaysia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
