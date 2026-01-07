import { useState, useEffect } from 'react';
import { Button, Input, Select } from '@/components/ui';
import type {
  Article,
  ArticleCategory,
  ArticleGender,
  CreateArticleRequest,
  CategoryConstraints,
} from '@/types';

const CATEGORY_OPTIONS = [
  { value: 'clothing', label: 'Vêtements' },
  { value: 'shoes', label: 'Chaussures' },
  { value: 'nursery', label: 'Puériculture' },
  { value: 'toys', label: 'Jouets' },
  { value: 'books', label: 'Livres' },
  { value: 'accessories', label: 'Accessoires' },
  { value: 'other', label: 'Autres' },
];

const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  clothing: [
    { value: 'tshirt', label: 'T-shirt' },
    { value: 'shirt', label: 'Chemise' },
    { value: 'sweater', label: 'Pull' },
    { value: 'pants', label: 'Pantalon' },
    { value: 'shorts', label: 'Short' },
    { value: 'skirt', label: 'Jupe' },
    { value: 'dress', label: 'Robe' },
    { value: 'coat', label: 'Manteau/Blouson (1 max)' },
    { value: 'jacket', label: 'Veste' },
    { value: 'raincoat', label: 'Imperméable' },
    { value: 'jogging', label: 'Jogging' },
    { value: 'layette', label: 'Layette' },
  ],
  accessories: [
    { value: 'handbag', label: 'Sac à main (1 max)' },
    { value: 'scarf', label: 'Écharpe (2 max)' },
    { value: 'hat', label: 'Chapeau/Bonnet' },
    { value: 'belt', label: 'Ceinture' },
    { value: 'gloves', label: 'Gants' },
  ],
  nursery: [
    { value: 'stroller', label: 'Poussette (150€ max)' },
    { value: 'bed_bumper', label: 'Tour de lit (1 max)' },
    { value: 'carrier', label: 'Porte-bébé' },
    { value: 'highchair', label: 'Chaise haute' },
    { value: 'bath', label: 'Baignoire/Transat' },
  ],
  toys: [
    { value: 'plush', label: 'Peluche (1 max)' },
    { value: 'game', label: 'Jeu de société' },
    { value: 'puzzle', label: 'Puzzle' },
    { value: 'figure', label: 'Figurine' },
    { value: 'vehicle', label: 'Véhicule' },
  ],
  books: [
    { value: 'child_book', label: 'Livre enfant' },
    { value: 'adult_book', label: 'Livre adulte (5 max)' },
  ],
};

const GENDER_OPTIONS = [
  { value: '', label: 'Non spécifié' },
  { value: 'girl', label: 'Fille' },
  { value: 'boy', label: 'Garçon' },
  { value: 'unisex', label: 'Mixte' },
  { value: 'adult_female', label: 'Femme' },
  { value: 'adult_male', label: 'Homme' },
  { value: 'adult_unisex', label: 'Adulte mixte' },
];

interface ArticleFormProps {
  article?: Article | null;
  constraints?: CategoryConstraints;
  clothingCount: number;
  onSubmit: (data: CreateArticleRequest) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ArticleForm({
  article,
  constraints,
  clothingCount,
  onSubmit,
  onCancel,
  isSubmitting,
}: ArticleFormProps) {
  const [category, setCategory] = useState<ArticleCategory>(article?.category ?? 'clothing');
  const [subcategory, setSubcategory] = useState(article?.subcategory ?? '');
  const [description, setDescription] = useState(article?.description ?? '');
  const [price, setPrice] = useState(article?.price?.toString() ?? '');
  const [size, setSize] = useState(article?.size ?? '');
  const [brand, setBrand] = useState(article?.brand ?? '');
  const [color, setColor] = useState(article?.color ?? '');
  const [gender, setGender] = useState<ArticleGender | ''>(article?.gender ?? '');
  const [isLot, setIsLot] = useState(article?.isLot ?? false);
  const [lotQuantity, setLotQuantity] = useState(article?.lotQuantity?.toString() ?? '');
  const [conformityCertified, setConformityCertified] = useState(article?.conformityCertified ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isClothing = category === 'clothing';
  const subcategoryOptions = SUBCATEGORY_OPTIONS[category] ?? [];
  const maxClothing = constraints?.maxClothingPerList ?? 12;
  const canAddClothing = !article && (clothingCount < maxClothing || !isClothing);

  // Reset subcategory when category changes
  useEffect(() => {
    if (!article) {
      setSubcategory('');
    }
  }, [category, article]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = 'Description requise';
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 1) {
      newErrors.price = 'Prix minimum 1€';
    } else if (subcategory === 'stroller' && priceNum > 150) {
      newErrors.price = 'Prix maximum 150€ pour les poussettes';
    }

    if (isLot) {
      const qty = parseInt(lotQuantity, 10);
      if (isNaN(qty) || qty < 1 || qty > 3) {
        newErrors.lotQuantity = 'Quantité entre 1 et 3';
      }
    }

    if (!canAddClothing && isClothing && !article) {
      newErrors.category = `Maximum de vêtements atteint (${maxClothing})`;
    }

    if (!conformityCertified) {
      newErrors.conformityCertified = 'Vous devez certifier que l\'article est propre et en bon état';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const data: CreateArticleRequest = {
      category,
      subcategory: subcategory || undefined,
      description: description.trim(),
      price: parseFloat(price),
      size: size.trim() || undefined,
      brand: brand.trim() || undefined,
      color: color.trim() || undefined,
      gender: gender || undefined,
      isLot,
      lotQuantity: isLot ? parseInt(lotQuantity, 10) : undefined,
      conformityCertified,
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category & Subcategory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie *
          </label>
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value as ArticleCategory)}
            disabled={!!article} // Can't change category when editing
          />
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>
        {subcategoryOptions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sous-catégorie
            </label>
            <Select
              options={[{ value: '', label: 'Sélectionner...' }, ...subcategoryOptions]}
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <Input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Pull bleu marine avec col rond"
          maxLength={255}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{description.length}/255 caractères</p>
      </div>

      {/* Price */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix (€) *
          </label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="1"
            max={subcategory === 'stroller' ? '150' : '100'}
            step="0.5"
            placeholder="Ex: 5"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Taille
          </label>
          <Input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="Ex: 12 mois, 38, M"
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genre
          </label>
          <Select
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(e) => setGender(e.target.value as ArticleGender | '')}
          />
        </div>
      </div>

      {/* Brand & Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marque
          </label>
          <Input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ex: Petit Bateau, H&M"
            maxLength={100}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Couleur
          </label>
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Ex: Bleu marine"
            maxLength={50}
          />
        </div>
      </div>

      {/* Lot */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isLot}
            onChange={(e) => setIsLot(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Vendre en lot (groupe d'articles similaires)
          </span>
        </label>
        {isLot && (
          <div className="mt-3 ml-7">
            <label className="block text-sm text-gray-600 mb-1">
              Nombre d'articles dans le lot (max 3)
            </label>
            <Input
              type="number"
              value={lotQuantity}
              onChange={(e) => setLotQuantity(e.target.value)}
              min="1"
              max="3"
              className="w-24"
            />
            {errors.lotQuantity && (
              <p className="mt-1 text-sm text-red-600">{errors.lotQuantity}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Les lots ne peuvent contenir que des vêtements de taille 36 mois ou moins.
            </p>
          </div>
        )}
      </div>

      {/* Conformity certification */}
      <div className={`rounded-lg p-4 ${errors.conformityCertified ? 'bg-red-50 border border-red-300' : 'bg-green-50 border border-green-200'}`}>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={conformityCertified}
            onChange={(e) => setConformityCertified(e.target.checked)}
            className={`mt-1 h-4 w-4 border-gray-300 rounded ${errors.conformityCertified ? 'text-red-600 focus:ring-red-500' : 'text-green-600 focus:ring-green-500'}`}
          />
          <div>
            <span className={`text-sm font-medium ${errors.conformityCertified ? 'text-red-800' : 'text-green-800'}`}>
              Je certifie que cet article est propre et en bon état *
            </span>
            <p className={`text-xs mt-1 ${errors.conformityCertified ? 'text-red-700' : 'text-green-700'}`}>
              L'article ne présente pas de tache, trou, déchirure ou défaut majeur.
              Il est propre et prêt à être vendu.
            </p>
            {errors.conformityCertified && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.conformityCertified}</p>
            )}
          </div>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Enregistrement...'
            : article
            ? 'Modifier'
            : 'Ajouter l\'article'}
        </Button>
      </div>
    </form>
  );
}
