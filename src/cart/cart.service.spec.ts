import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cart: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      cartItem: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addItem', () => {
    it('should reject non-positive quantities', async () => {
      await expect(service.addItem('usr_1', 'prod_1', 0)).rejects.toThrow(BadRequestException);
    });

    it('should reject when product is unavailable or out of stock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        name: 'Oil',
        isAvailable: false,
        stock: 0,
      });

      await expect(service.addItem('usr_1', 'prod_1', 1)).rejects.toThrow(BadRequestException);
    });

    it('should reject when requested quantity exceeds available stock', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        name: 'Oil',
        isAvailable: true,
        stock: 3,
      });
      prisma.cart.findUnique.mockResolvedValue({ id: 'cart_1', userId: 'usr_1', items: [] });
      prisma.cartItem.findUnique.mockResolvedValue({ id: 'ci_1', quantity: 2 });

      // Current 2 + new 2 = 4 > stock 3
      await expect(service.addItem('usr_1', 'prod_1', 2)).rejects.toThrow(BadRequestException);
    });
  });

  describe('formatCart', () => {
    it('should correctly calculate free shipping above 499 threshold', () => {
      const mockCart = {
        id: 'cart_1',
        userId: 'usr_1',
        items: [
          {
            id: 'ci_1',
            cartId: 'cart_1',
            productId: 'p_1',
            quantity: 2,
            product: {
              id: 'p_1',
              name: 'Ghee',
              price: 300,
              stock: 10,
              isAvailable: true,
              imageUrl: '',
            },
          },
        ],
        updatedAt: new Date(),
      };

      const result = service.formatCart(mockCart);
      expect(result.subtotal).toBe(600);
      expect(result.deliveryCharge).toBe(0); // Free shipping because subtotal >= 499
      expect(result.grandTotal).toBe(600);
    });

    it('should apply 40 standard delivery charge for orders below 499', () => {
      const mockCart = {
        id: 'cart_1',
        userId: 'usr_1',
        items: [
          {
            id: 'ci_1',
            cartId: 'cart_1',
            productId: 'p_1',
            quantity: 1,
            product: {
              id: 'p_1',
              name: 'Honey',
              price: 340,
              stock: 10,
              isAvailable: true,
              imageUrl: '',
            },
          },
        ],
        updatedAt: new Date(),
      };

      const result = service.formatCart(mockCart);
      expect(result.subtotal).toBe(340);
      expect(result.deliveryCharge).toBe(40); // 40 fee because subtotal < 499
      expect(result.grandTotal).toBe(380);
    });
  });
});
