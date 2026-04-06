import React, { useState, useEffect } from 'react';
import { foodApi } from '../services/api';

export default function FoodList({ user, onAddToCart }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState({});

  useEffect(() => {
    foodApi.getAll().then(res => { setFoods(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleAdd = (food) => {
    onAddToCart(food);
    setAdded(prev => ({ ...prev, [food.id]: true }));
    setTimeout(() => setAdded(prev => ({ ...prev, [food.id]: false })), 1000);
  };

  if (loading) return <div className="loading">⏳ Đang tải menu...</div>;

  return (
    <div className="page">
      <h2>🍜 Menu hôm nay</h2>
      <div className="food-grid">
        {foods.map(food => (
          <div key={food.id} className={`food-card ${!food.available ? 'unavailable' : ''}`}>
            <div className="food-img">{['🍛','🍜','🍖','🥗','🍱','🥤'][food.id % 6]}</div>
            <div className="food-info">
              <h3>{food.name}</h3>
              <p className="food-desc">{food.description}</p>
              <div className="food-footer">
                <span className="price">{food.price?.toLocaleString()}đ</span>
                <button
                  className={`btn-add ${added[food.id] ? 'added' : ''}`}
                  onClick={() => handleAdd(food)}
                  disabled={!food.available}
                >
                  {added[food.id] ? '✓ Đã thêm' : food.available ? '+ Thêm' : 'Hết hàng'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
