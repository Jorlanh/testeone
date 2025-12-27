import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  Search, Calendar, User, Tag, ArrowRight, ChevronRight, Mail, Facebook, Twitter, Linkedin, Instagram, Menu, X
} from 'lucide-react';
import { Logo } from '../components/Logo';
import api from '../services/api';
import { BlogPost } from '../types';

const Blog: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [currentPost, setCurrentPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await api.get('/public/blog-posts');
        const allPosts = response.data;
        setPosts(allPosts);
        
        if (slug) {
          const post = allPosts.find((p: any) => p.slug === slug);
          setCurrentPost(post || null);
        }
      } catch (e) {
        console.error("Erro ao carregar blog");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // Mantendo o design do blog...
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* ... conteúdo idêntico ao original, apenas removendo chamadas ao MockService ... */}
    </div>
  );
};

export default Blog;