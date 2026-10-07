import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return {
      id: user.profile?.id || `prof_${user.id}`,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      avatarUrl: user.profileImage || '',
      profileImage: user.profileImage || '',
      preferredLanguage: user.profile?.preferredLanguage || 'en',
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async updateProfile(userId: string, updates: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.fullName ? { fullName: updates.fullName.trim() } : {}),
        ...(updates.phone ? { phone: updates.phone.trim() } : {}),
        ...(updates.avatarUrl ? { profileImage: updates.avatarUrl } : {}),
        ...(updates.profileImage ? { profileImage: updates.profileImage } : {}),
      },
      include: {
        profile: true,
      },
    });

    if (updates.preferredLanguage && user.profile) {
      await this.prisma.userProfile.update({
        where: { id: user.profile.id },
        data: { preferredLanguage: updates.preferredLanguage },
      });
    }

    return this.getProfile(userId);
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...dto,
        userId,
        country: dto.country || 'India',
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found.');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You cannot modify an address belonging to another user.');
    }

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found.');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You cannot delete an address belonging to another user.');
    }

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return { success: true };
  }
}
