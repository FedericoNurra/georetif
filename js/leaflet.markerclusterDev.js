/*
 Leaflet.markercluster, Provides Beautiful Animated Marker Clustering functionality for Leaflet, a JS library for interactive maps.
 https://github.com/Leaflet/Leaflet.markercluster
 (c) 2012-2013, Dave Leaver, smartrak
*/
! function(e, t, i) {
	L.MarkerClusterGroup = L.FeatureGroup.extend({
			options: {
				maxClusterRadius: 70,
				iconCreateFunction: null,
				spiderfyOnMaxZoom: !1,
				showCoverageOnHover: !0,
				zoomToBoundsOnClick: !0,
				singleMarkerMode: !0,
				disableClusteringAtZoom: null,
				removeOutsideVisibleBounds: !0,
				animate: !0,
				animateAddingMarkers: !1,
				spiderfyDistanceMultiplier: 0.2,
				spiderLegPolylineOptions: {
					weight: 0.5,
					color: "#222",
					opacity: .5
				},
				chunkedLoading: !1,
				chunkInterval: 200,
				chunkDelay: 50,
				chunkProgress: null,
				interactive: true,
				polygonOptions: {}
			},
			initialize: function(e) {
				L.Util.setOptions(this, e), this.options.iconCreateFunction || (this.options.iconCreateFunction = this._defaultIconCreateFunction), this._featureGroup = L.featureGroup(), this._featureGroup.addEventParent(this), this._nonPointGroup = L.featureGroup(), this._nonPointGroup.addEventParent(this), this._inZoomAnimation = 0, this._needsClustering = [], this._needsRemoving = [], this._currentShownBounds = null, this._queue = [];
				var t = L.DomUtil.TRANSITION && this.options.animate;
				L.extend(this, t ? this._withAnimation : this._noAnimation), this._markerCluster = t ? L.MarkerCluster : L.MarkerClusterNonAnimated
			},
			addLayer: function(e) {
				if (e instanceof L.LayerGroup) return this.addLayers([e]);
				if (!e.getLatLng) return this._nonPointGroup.addLayer(e), this;
				if (!this._map) return this._needsClustering.push(e), this;
				if (this.hasLayer(e)) return this;
				this._unspiderfy && this._unspiderfy(), this._addLayer(e, this._maxZoom), this._topClusterLevel._recalculateBounds();
				var t = e,
					i = this._map.getZoom();
				if (e.__parent)
					for (; t.__parent._zoom >= i;) t = t.__parent;
				return this._currentShownBounds.contains(t.getLatLng()) && (this.options.animateAddingMarkers ? this._animationAddLayer(e, t) : this._animationAddLayerNonAnimated(e, t)), this
			},
			removeLayer: function(e) {
				return e instanceof L.LayerGroup ? this.removeLayers([e]) : e.getLatLng ? this._map ? e.__parent ? (this._unspiderfy && (this._unspiderfy(), this._unspiderfyLayer(e)), this._removeLayer(e, !0), this._topClusterLevel._recalculateBounds(), e.off("move", this._childMarkerMoved, this), this._featureGroup.hasLayer(e) && (this._featureGroup.removeLayer(e), e.clusterShow && e.clusterShow()), this) : this : (!this._arraySplice(this._needsClustering, e) && this.hasLayer(e) && this._needsRemoving.push(e), this) : (this._nonPointGroup.removeLayer(e), this)
			},
			addLayers: function(e) {
				if (!L.Util.isArray(e)) return this.addLayer(e);
				var t, i = this._featureGroup,
					n = this._nonPointGroup,
					s = this.options.chunkedLoading,
					r = this.options.chunkInterval,
					o = this.options.chunkProgress,
					a = e.length,
					h = 0,
					u = !0;
				if (this._map) {
					var l = (new Date).getTime(),
						_ = L.bind(function() {
							for (var d = (new Date).getTime(); a > h; h++) {
								if (s && 0 === h % 200) {
									var c = (new Date).getTime() - d;
									if (c > r) break
								}
								if (t = e[h], t instanceof L.LayerGroup) u && (e = e.slice(), u = !1), this._extractNonGroupLayers(t, e), a = e.length;
								else if (t.getLatLng) {
									if (!this.hasLayer(t) && (this._addLayer(t, this._maxZoom), t.__parent && 2 === t.__parent.getChildCount())) {
										var p = t.__parent.getAllChildMarkers(),
											f = p[0] === t ? p[1] : p[0];
										i.removeLayer(f)
									}
								} else n.addLayer(t)
							}
							o && o(h, a, (new Date).getTime() - l), h === a ? (this._topClusterLevel._recalculateBounds(), this._featureGroup.eachLayer(function(e) {
								e instanceof L.MarkerCluster && e._iconNeedsUpdate && e._updateIcon()
							}), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds)) : setTimeout(_, this.options.chunkDelay)
						}, this);
					_()
				} else
					for (var d = this._needsClustering; a > h; h++) t = e[h], t instanceof L.LayerGroup ? (u && (e = e.slice(), u = !1), this._extractNonGroupLayers(t, e), a = e.length) : t.getLatLng ? this.hasLayer(t) || d.push(t) : n.addLayer(t);
				return this
			},
			removeLayers: function(e) {
				var t, i, n = e.length,
					s = this._featureGroup,
					r = this._nonPointGroup,
					o = !0;
				if (!this._map) {
					for (t = 0; n > t; t++) i = e[t], i instanceof L.LayerGroup ? (o && (e = e.slice(), o = !1), this._extractNonGroupLayers(i, e), n = e.length) : (this._arraySplice(this._needsClustering, i), r.removeLayer(i), this.hasLayer(i) && this._needsRemoving.push(i));
					return this
				}
				if (this._unspiderfy) {
					this._unspiderfy();
					var a = e.slice(),
						h = n;
					for (t = 0; h > t; t++) i = a[t], i instanceof L.LayerGroup ? (this._extractNonGroupLayers(i, a), h = a.length) : this._unspiderfyLayer(i)
				}
				for (t = 0; n > t; t++) i = e[t], i instanceof L.LayerGroup ? (o && (e = e.slice(), o = !1), this._extractNonGroupLayers(i, e), n = e.length) : i.__parent ? (this._removeLayer(i, !0, !0), s.hasLayer(i) && (s.removeLayer(i), i.clusterShow && i.clusterShow())) : r.removeLayer(i);
				return this._topClusterLevel._recalculateBounds(), this._topClusterLevel._recursivelyAddChildrenToMap(null, this._zoom, this._currentShownBounds), s.eachLayer(function(e) {
					e instanceof L.MarkerCluster && e._updateIcon()
				}), this
			},
			clearLayers: function() {
				return this._map || (this._needsClustering = [], delete this._gridClusters, delete this._gridUnclustered), this._noanimationUnspiderfy && this._noanimationUnspiderfy(), this._featureGroup.clearLayers(), this._nonPointGroup.clearLayers(), this.eachLayer(function(e) {
					e.off("move", this._childMarkerMoved, this), delete e.__parent
				}), this._map && this._generateInitialClusters(), this
			},
			getBounds: function() {
				var e = new L.LatLngBounds;
				this._topClusterLevel && e.extend(this._topClusterLevel._bounds);
				for (var t = this._needsClustering.length - 1; t >= 0; t--) e.extend(this._needsClustering[t].getLatLng());
				return e.extend(this._nonPointGroup.getBounds()), e
			},
			eachLayer: function(e, t) {
				var i, n = this._needsClustering.slice(),
					s = this._needsRemoving;
				for (this._topClusterLevel && this._topClusterLevel.getAllChildMarkers(n), i = n.length - 1; i >= 0; i--) - 1 === s.indexOf(n[i]) && e.call(t, n[i]);
				this._nonPointGroup.eachLayer(e, t)
			},
			getLayers: function() {
				var e = [];
				return this.eachLayer(function(t) {
					e.push(t)
				}), e
			},
			getLayer: function(e) {
				var t = null;
				return e = parseInt(e, 10), this.eachLayer(function(i) {
					L.stamp(i) === e && (t = i)
				}), t
			},
			hasLayer: function(e) {
				if (!e) return !1;
				var t, i = this._needsClustering;
				for (t = i.length - 1; t >= 0; t--)
					if (i[t] === e) return !0;
				for (i = this._needsRemoving, t = i.length - 1; t >= 0; t--)
					if (i[t] === e) return !1;
				return !(!e.__parent || e.__parent._group !== this) || this._nonPointGroup.hasLayer(e)
			},
			zoomToShowLayer: function(e, t) {
				"function" != typeof t && (t = function() {});
				var i = function() {
					!e._icon && !e.__parent._icon || this._inZoomAnimation || (this._map.off("moveend", i, this), this.off("animationend", i, this), e._icon ? t() : e.__parent._icon && (this.once("spiderfied", t, this), e.__parent.spiderfy()))
				};
				if (e._icon && this._map.getBounds().contains(e.getLatLng())) t();
				else if (e.__parent._zoom < this._map.getZoom()) this._map.on("moveend", i, this), this._map.panTo(e.getLatLng());
				else {
					var n = function() {
						this._map.off("movestart", n, this), n = null
					};
					this._map.on("movestart", n, this), this._map.on("moveend", i, this), this.on("animationend", i, this), e.__parent.zoomToBounds(), n && i.call(this)
				}
			},
			onAdd: function(e) {
				this._map = e;
				var t, i, n;
				if (!isFinite(this._map.getMaxZoom())) throw "Map has no maxZoom specified";
				for (this._featureGroup.addTo(e), this._nonPointGroup.addTo(e), this._gridClusters || this._generateInitialClusters(), this._maxLat = e.options.crs.projection.MAX_LATITUDE, t = 0, i = this._needsRemoving.length; i > t; t++) n = this._needsRemoving[t], this._removeLayer(n, !0);
				this._needsRemoving = [], this._zoom = this._map.getZoom(), this._currentShownBounds = this._getExpandedVisibleBounds(), this._map.on("zoomend", this._zoomEnd, this), this._map.on("moveend", this._moveEnd, this), this._spiderfierOnAdd && this._spiderfierOnAdd(), this._bindEvents(), i = this._needsClustering, this._needsClustering = [], this.addLayers(i)
			},
			onRemove: function(e) {
				e.off("zoomend", this._zoomEnd, this), e.off("moveend", this._moveEnd, this), this._unbindEvents(), this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", ""), this._spiderfierOnRemove && this._spiderfierOnRemove(), delete this._maxLat, this._hideCoverage(), this._featureGroup.remove(), this._nonPointGroup.remove(), this._featureGroup.clearLayers(), this._map = null
			},
			getVisibleParent: function(e) {
				for (var t = e; t && !t._icon;) t = t.__parent;
				return t || null
			},
			_arraySplice: function(e, t) {
				for (var i = e.length - 1; i >= 0; i--)
					if (e[i] === t) return e.splice(i, 1), !0
			},
			_removeFromGridUnclustered: function(e, t) {
				for (var i = this._map, n = this._gridUnclustered; t >= 0 && n[t].removeObject(e, i.project(e.getLatLng(), t)); t--);
			},
			_childMarkerMoved: function(e) {
				this._ignoreMove || (e.target._latlng = e.oldLatLng, this.removeLayer(e.target), e.target._latlng = e.latlng, this.addLayer(e.target))
			},
			_removeLayer: function(e, t, i) {
				var n = this._gridClusters,
					s = this._gridUnclustered,
					r = this._featureGroup,
					o = this._map;
				t && this._removeFromGridUnclustered(e, this._maxZoom);
				var a, h = e.__parent,
					u = h._markers;
				for (this._arraySplice(u, e); h && (h._childCount--, h._boundsNeedUpdate = !0, !(h._zoom < 0));) t && h._childCount <= 1 ? (a = h._markers[0] === e ? h._markers[1] : h._markers[0], n[h._zoom].removeObject(h, o.project(h._cLatLng, h._zoom)), s[h._zoom].addObject(a, o.project(a.getLatLng(), h._zoom)), this._arraySplice(h.__parent._childClusters, h), h.__parent._markers.push(a), a.__parent = h.__parent, h._icon && (r.removeLayer(h), i || r.addLayer(a))) : i && h._icon || h._updateIcon(), h = h.__parent;
				delete e.__parent
			},
			_isOrIsParent: function(e, t) {
				for (; t;) {
					if (e === t) return !0;
					t = t.parentNode
				}
				return !1
			},
			fire: function(e, t, i) {
				if (t && t.layer instanceof L.MarkerCluster) {
					if (t.originalEvent && this._isOrIsParent(t.layer._icon, t.originalEvent.relatedTarget)) return;
					e = "cluster" + e
				}
				L.FeatureGroup.prototype.fire.call(this, e, t, i)
			},
			listens: function(e, t) {
				return L.FeatureGroup.prototype.listens.call(this, e, t) || L.FeatureGroup.prototype.listens.call(this, "cluster" + e, t)
			},
			_defaultIconCreateFunction: function(e) {
				var t = e.getChildCount(),
					i = " marker-cluster-";
				return i += 100 > t ? "small" : 500 > t ? "medium" : "large", new L.DivIcon({
					html: "<div><span>" + t + "</span></div>",
					className: "marker-cluster" + i,
					iconSize: new L.Point(40, 40)
				})
			},
			_bindEvents: function() {
				var e = this._map,
					t = this.options.spiderfyOnMaxZoom,
					i = this.options.showCoverageOnHover,
					n = this.options.zoomToBoundsOnClick;
				(t || n) && this.on("clusterclick", this._zoomOrSpiderfy, this), i && (this.on("clustermouseover", this._showCoverage, this), this.on("clustermouseout", this._hideCoverage, this), e.on("zoomend", this._hideCoverage, this))
			},
			_zoomOrSpiderfy: function(e) {
				for (var t = e.layer, i = t; 1 === i._childClusters.length;) i = i._childClusters[0];
				i._zoom === this._maxZoom && i._childCount === t._childCount && this.options.spiderfyOnMaxZoom ? t.spiderfy() : this.options.zoomToBoundsOnClick && t.zoomToBounds(), e.originalEvent && 13 === e.originalEvent.keyCode && this._map._container.focus()
			},
			_showCoverage: function(e) {
				var t = this._map;
				this._inZoomAnimation || (this._shownPolygon && t.removeLayer(this._shownPolygon), e.layer.getChildCount() > 2 && e.layer !== this._spiderfied && (this._shownPolygon = new L.Polygon(e.layer.getConvexHull(), this.options.polygonOptions), t.addLayer(this._shownPolygon)))
			},
			_hideCoverage: function() {
				this._shownPolygon && (this._map.removeLayer(this._shownPolygon), this._shownPolygon = null)
			},
			_unbindEvents: function() {
				var e = this.options.spiderfyOnMaxZoom,
					t = this.options.showCoverageOnHover,
					i = this.options.zoomToBoundsOnClick,
					n = this._map;
				(e || i) && this.off("clusterclick", this._zoomOrSpiderfy, this), t && (this.off("clustermouseover", this._showCoverage, this), this.off("clustermouseout", this._hideCoverage, this), n.off("zoomend", this._hideCoverage, this))
			},
			_zoomEnd: function() {
				this._map && (this._mergeSplitClusters(), this._zoom = Math.round(this._map._zoom), this._currentShownBounds = this._getExpandedVisibleBounds())
			},
			_moveEnd: function() {
				if (!this._inZoomAnimation) {
					var e = this._getExpandedVisibleBounds();
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, this._zoom, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, Math.round(this._map._zoom), e), this._currentShownBounds = e
				}
			},
			_generateInitialClusters: function() {
				var e = this._map.getMaxZoom(),
					t = this.options.maxClusterRadius,
					i = t;
				"function" != typeof t && (i = function() {
					return t
				}), this.options.disableClusteringAtZoom && (e = this.options.disableClusteringAtZoom - 1), this._maxZoom = e, this._gridClusters = {}, this._gridUnclustered = {};
				for (var n = e; n >= 0; n--) this._gridClusters[n] = new L.DistanceGrid(i(n)), this._gridUnclustered[n] = new L.DistanceGrid(i(n));
				this._topClusterLevel = new this._markerCluster(this, -1)
			},
			_addLayer: function(e, t) {
				var i, n, s = this._gridClusters,
					r = this._gridUnclustered;
				for (this.options.singleMarkerMode && this._overrideMarkerIcon(e), e.on("move", this._childMarkerMoved, this); t >= 0; t--) {
					i = this._map.project(e.getLatLng(), t);
					var o = s[t].getNearObject(i);
					if (o) return o._addChild(e), e.__parent = o, void 0;
					if (o = r[t].getNearObject(i)) {
						var a = o.__parent;
						a && this._removeLayer(o, !1);
						var h = new this._markerCluster(this, t, o, e);
						s[t].addObject(h, this._map.project(h._cLatLng, t)), o.__parent = h, e.__parent = h;
						var u = h;
						for (n = t - 1; n > a._zoom; n--) u = new this._markerCluster(this, n, u), s[n].addObject(u, this._map.project(o.getLatLng(), n));
						return a._addChild(u), this._removeFromGridUnclustered(o, t), void 0
					}
					r[t].addObject(e, i)
				}
				this._topClusterLevel._addChild(e), e.__parent = this._topClusterLevel
			},
			_enqueue: function(e) {
				this._queue.push(e), this._queueTimeout || (this._queueTimeout = setTimeout(L.bind(this._processQueue, this), 300))
			},
			_processQueue: function() {
				for (var e = 0; e < this._queue.length; e++) this._queue[e].call(this);
				this._queue.length = 0, clearTimeout(this._queueTimeout), this._queueTimeout = null
			},
			_mergeSplitClusters: function() {
				var e = Math.round(this._map._zoom);
				this._processQueue(), this._zoom < e && this._currentShownBounds.intersects(this._getExpandedVisibleBounds()) ? (this._animationStart(), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, this._zoom, this._getExpandedVisibleBounds()), this._animationZoomIn(this._zoom, e)) : this._zoom > e ? (this._animationStart(), this._animationZoomOut(this._zoom, e)) : this._moveEnd()
			},
			_getExpandedVisibleBounds: function() {
				return this.options.removeOutsideVisibleBounds ? L.Browser.mobile ? this._checkBoundsMaxLat(this._map.getBounds()) : this._checkBoundsMaxLat(this._map.getBounds().pad(1)) : this._mapBoundsInfinite
			},
			_checkBoundsMaxLat: function(e) {
				var t = this._maxLat;
				return t !== i && (e.getNorth() >= t && (e._northEast.lat = 1 / 0), e.getSouth() <= -t && (e._southWest.lat = -1 / 0)), e
			},
			_animationAddLayerNonAnimated: function(e, t) {
				if (t === e) this._featureGroup.addLayer(e);
				else if (2 === t._childCount) {
					t._addToMap();
					var i = t.getAllChildMarkers();
					this._featureGroup.removeLayer(i[0]), this._featureGroup.removeLayer(i[1])
				} else t._updateIcon()
			},
			_extractNonGroupLayers: function(e, t) {
				var i, n = e.getLayers(),
					s = 0;
				for (t = t || []; s < n.length; s++) i = n[s], i instanceof L.LayerGroup ? this._extractNonGroupLayers(i, t) : t.push(i);
				return t
			},
			_overrideMarkerIcon: function(e) {
				var t = e.options.icon = this.options.iconCreateFunction({
					getChildCount: function() {
						return 1
					},
					getAllChildMarkers: function() {
						return [e]
					}
				});
				return t
			}
		}), L.MarkerClusterGroup.include({
			_mapBoundsInfinite: new L.LatLngBounds(new L.LatLng(-1 / 0, -1 / 0), new L.LatLng(1 / 0, 1 / 0))
		}), L.MarkerClusterGroup.include({
			_noAnimation: {
				_animationStart: function() {},
				_animationZoomIn: function(e, t) {
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this.fire("animationend")
				},
				_animationZoomOut: function(e, t) {
					this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, e), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this.fire("animationend")
				},
				_animationAddLayer: function(e, t) {
					this._animationAddLayerNonAnimated(e, t)
				}
			},
			_withAnimation: {
				_animationStart: function() {
					this._map._mapPane.className += " leaflet-cluster-anim", this._inZoomAnimation++
				},
				_animationZoomIn: function(e, t) {
					var i, n = this._getExpandedVisibleBounds(),
						s = this._featureGroup;
					this._ignoreMove = !0, this._topClusterLevel._recursively(n, e, 0, function(r) {
						var o, a = r._latlng,
							h = r._markers;
						for (n.contains(a) || (a = null), r._isSingleParent() && e + 1 === t ? (s.removeLayer(r), r._recursivelyAddChildrenToMap(null, t, n)) : (r.clusterHide(), r._recursivelyAddChildrenToMap(a, t, n)), i = h.length - 1; i >= 0; i--) o = h[i], n.contains(o._latlng) || s.removeLayer(o)
					}), this._forceLayout(), this._topClusterLevel._recursivelyBecomeVisible(n, t), s.eachLayer(function(e) {
						e instanceof L.MarkerCluster || !e._icon || e.clusterShow()
					}), this._topClusterLevel._recursively(n, e, t, function(e) {
						e._recursivelyRestoreChildPositions(t)
					}), this._ignoreMove = !1, this._enqueue(function() {
						this._topClusterLevel._recursively(n, e, 0, function(e) {
							s.removeLayer(e), e.clusterShow()
						}), this._animationEnd()
					})
				},
				_animationZoomOut: function(e, t) {
					this._animationZoomOutSingle(this._topClusterLevel, e - 1, t), this._topClusterLevel._recursivelyAddChildrenToMap(null, t, this._getExpandedVisibleBounds()), this._topClusterLevel._recursivelyRemoveChildrenFromMap(this._currentShownBounds, e, this._getExpandedVisibleBounds())
				},
				_animationAddLayer: function(e, t) {
					var i = this,
						n = this._featureGroup;
					n.addLayer(e), t !== e && (t._childCount > 2 ? (t._updateIcon(), this._forceLayout(), this._animationStart(), e._setPos(this._map.latLngToLayerPoint(t.getLatLng())), e.clusterHide(), this._enqueue(function() {
						n.removeLayer(e), e.clusterShow(), i._animationEnd()
					})) : (this._forceLayout(), i._animationStart(), i._animationZoomOutSingle(t, this._map.getMaxZoom(), this._map.getZoom())))
				}
			},
			_animationZoomOutSingle: function(e, t, i) {
				var n = this._getExpandedVisibleBounds();
				e._recursivelyAnimateChildrenInAndAddSelfToMap(n, t + 1, i);
				var s = this;
				this._forceLayout(), e._recursivelyBecomeVisible(n, i), this._enqueue(function() {
					if (1 === e._childCount) {
						var r = e._markers[0];
						this._ignoreMove = !0, r.setLatLng(r.getLatLng()), this._ignoreMove = !1, r.clusterShow && r.clusterShow()
					} else e._recursively(n, i, 0, function(e) {
						e._recursivelyRemoveChildrenFromMap(n, t + 1)
					});
					s._animationEnd()
				})
			},
			_animationEnd: function() {
				this._map && (this._map._mapPane.className = this._map._mapPane.className.replace(" leaflet-cluster-anim", "")), this._inZoomAnimation--, this.fire("animationend")
			},
			_forceLayout: function() {
				L.Util.falseFn(t.body.offsetWidth)
			}
		}), L.markerClusterGroup = function(e) {
			return new L.MarkerClusterGroup(e)
		}, L.MarkerCluster = L.Marker.extend({
			initialize: function(e, t, i, n) {
				L.Marker.prototype.initialize.call(this, i ? i._cLatLng || i.getLatLng() : new L.LatLng(0, 0), {
					icon: this
				}), this._group = e, this._zoom = t, this._markers = [], this._childClusters = [], this._childCount = 0, this._iconNeedsUpdate = !0, this._boundsNeedUpdate = !0, this._bounds = new L.LatLngBounds, i && this._addChild(i), n && this._addChild(n)
			},
			getAllChildMarkers: function(e) {
				e = e || [];
				for (var t = this._childClusters.length - 1; t >= 0; t--) this._childClusters[t].getAllChildMarkers(e);
				for (var i = this._markers.length - 1; i >= 0; i--) e.push(this._markers[i]);
				return e
			},
			getChildCount: function() {
				return this._childCount
			},
			zoomToBounds: function() {
				for (var e, t = this._childClusters.slice(), i = this._group._map, n = i.getBoundsZoom(this._bounds), s = this._zoom + 1, r = i.getZoom(); t.length > 0 && n > s;) {
					s++;
					var o = [];
					for (e = 0; e < t.length; e++) o = o.concat(t[e]._childClusters);
					t = o
				}
				n > s ? this._group._map.setView(this._latlng, s) : r >= n ? this._group._map.setView(this._latlng, r + 1) : this._group._map.fitBounds(this._bounds)
			},
			getBounds: function() {
				var e = new L.LatLngBounds;
				return e.extend(this._bounds), e
			},
			_updateIcon: function() {
				this._iconNeedsUpdate = !0, this._icon && this.setIcon(this)
			},
			createIcon: function() {
				return this._iconNeedsUpdate && (this._iconObj = this._group.options.iconCreateFunction(this), this._iconNeedsUpdate = !1), this._iconObj.createIcon()
			},
			createShadow: function() {
				return this._iconObj.createShadow()
			},
			_addChild: function(e, t) {
				this._iconNeedsUpdate = !0, this._boundsNeedUpdate = !0, this._setClusterCenter(e), e instanceof L.MarkerCluster ? (t || (this._childClusters.push(e), e.__parent = this), this._childCount += e._childCount) : (t || this._markers.push(e), this._childCount++), this.__parent && this.__parent._addChild(e, !0)
			},
			_setClusterCenter: function(e) {
				this._cLatLng || (this._cLatLng = e._cLatLng || e._latlng)
			},
			_resetBounds: function() {
				var e = this._bounds;
				e._southWest && (e._southWest.lat = 1 / 0, e._southWest.lng = 1 / 0), e._northEast && (e._northEast.lat = -1 / 0, e._northEast.lng = -1 / 0)
			},
			_recalculateBounds: function() {
				var e, t, i, n, s = this._markers,
					r = this._childClusters,
					o = 0,
					a = 0,
					h = this._childCount;
				if (0 !== h) {
					for (this._resetBounds(), e = 0; e < s.length; e++) i = s[e]._latlng, this._bounds.extend(i), o += i.lat, a += i.lng;
					for (e = 0; e < r.length; e++) t = r[e], t._boundsNeedUpdate && t._recalculateBounds(), this._bounds.extend(t._bounds), i = t._wLatLng, n = t._childCount, o += i.lat * n, a += i.lng * n;
					this._latlng = this._wLatLng = new L.LatLng(o / h, a / h), this._boundsNeedUpdate = !1
				}
			},
			_addToMap: function(e) {
				e && (this._backupLatlng = this._latlng, this.setLatLng(e)), this._group._featureGroup.addLayer(this)
			},
			_recursivelyAnimateChildrenIn: function(e, t, i) {
				this._recursively(e, 0, i - 1, function(e) {
					var i, n, s = e._markers;
					for (i = s.length - 1; i >= 0; i--) n = s[i], n._icon && (n._setPos(t), n.clusterHide())
				}, function(e) {
					var i, n, s = e._childClusters;
					for (i = s.length - 1; i >= 0; i--) n = s[i], n._icon && (n._setPos(t), n.clusterHide())
				})
			},
			_recursivelyAnimateChildrenInAndAddSelfToMap: function(e, t, i) {
				this._recursively(e, i, 0, function(n) {
					n._recursivelyAnimateChildrenIn(e, n._group._map.latLngToLayerPoint(n.getLatLng()).round(), t), n._isSingleParent() && t - 1 === i ? (n.clusterShow(), n._recursivelyRemoveChildrenFromMap(e, t)) : n.clusterHide(), n._addToMap()
				})
			},
			_recursivelyBecomeVisible: function(e, t) {
				this._recursively(e, 0, t, null, function(e) {
					e.clusterShow()
				})
			},
			_recursivelyAddChildrenToMap: function(e, t, i) {
				this._recursively(i, -1, t, function(n) {
					if (t !== n._zoom)
						for (var s = n._markers.length - 1; s >= 0; s--) {
							var r = n._markers[s];
							i.contains(r._latlng) && (e && (r._backupLatlng = r.getLatLng(), r.setLatLng(e), r.clusterHide && r.clusterHide()), n._group._featureGroup.addLayer(r))
						}
				}, function(t) {
					t._addToMap(e)
				})
			},
			_recursivelyRestoreChildPositions: function(e) {
				for (var t = this._markers.length - 1; t >= 0; t--) {
					var i = this._markers[t];
					i._backupLatlng && (i.setLatLng(i._backupLatlng), delete i._backupLatlng)
				}
				if (e - 1 === this._zoom)
					for (var n = this._childClusters.length - 1; n >= 0; n--) this._childClusters[n]._restorePosition();
				else
					for (var s = this._childClusters.length - 1; s >= 0; s--) this._childClusters[s]._recursivelyRestoreChildPositions(e)
			},
			_restorePosition: function() {
				this._backupLatlng && (this.setLatLng(this._backupLatlng), delete this._backupLatlng)
			},
			_recursivelyRemoveChildrenFromMap: function(e, t, i) {
				var n, s;
				this._recursively(e, -1, t - 1, function(e) {
					for (s = e._markers.length - 1; s >= 0; s--) n = e._markers[s], i && i.contains(n._latlng) || (e._group._featureGroup.removeLayer(n), n.clusterShow && n.clusterShow())
				}, function(e) {
					for (s = e._childClusters.length - 1; s >= 0; s--) n = e._childClusters[s], i && i.contains(n._latlng) || (e._group._featureGroup.removeLayer(n), n.clusterShow && n.clusterShow())
				})
			},
			_recursively: function(e, t, i, n, s) {
				var r, o, a = this._childClusters,
					h = this._zoom;
				if (t > h)
					for (r = a.length - 1; r >= 0; r--) o = a[r], e.intersects(o._bounds) && o._recursively(e, t, i, n, s);
				else if (n && n(this), s && this._zoom === i && s(this), i > h)
					for (r = a.length - 1; r >= 0; r--) o = a[r], e.intersects(o._bounds) && o._recursively(e, t, i, n, s)
			},
			_isSingleParent: function() {
				return this._childClusters.length > 0 && this._childClusters[0]._childCount === this._childCount
			}
		}), L.Marker.include({
			clusterHide: function() {
				return this.options.opacityWhenUnclustered = this.options.opacity || 1, this.setOpacity(0)
			},
			clusterShow: function() {
				var e = this.setOpacity(this.options.opacity || this.options.opacityWhenUnclustered);
				return delete this.options.opacityWhenUnclustered, e
			}
		}), L.DistanceGrid = function(e) {
			this._cellSize = e, this._sqCellSize = e * e, this._grid = {}, this._objectPoint = {}
		}, L.DistanceGrid.prototype = {
			addObject: function(e, t) {
				var i = this._getCoord(t.x),
					n = this._getCoord(t.y),
					s = this._grid,
					r = s[n] = s[n] || {},
					o = r[i] = r[i] || [],
					a = L.Util.stamp(e);
				this._objectPoint[a] = t, o.push(e)
			},
			updateObject: function(e, t) {
				this.removeObject(e), this.addObject(e, t)
			},
			removeObject: function(e, t) {
				var i, n, s = this._getCoord(t.x),
					r = this._getCoord(t.y),
					o = this._grid,
					a = o[r] = o[r] || {},
					h = a[s] = a[s] || [];
				for (delete this._objectPoint[L.Util.stamp(e)], i = 0, n = h.length; n > i; i++)
					if (h[i] === e) return h.splice(i, 1), 1 === n && delete a[s], !0
			},
			eachObject: function(e, t) {
				var i, n, s, r, o, a, h, u = this._grid;
				for (i in u) {
					o = u[i];
					for (n in o)
						for (a = o[n], s = 0, r = a.length; r > s; s++) h = e.call(t, a[s]), h && (s--, r--)
				}
			},
			getNearObject: function(e) {
				var t, i, n, s, r, o, a, h, u = this._getCoord(e.x),
					l = this._getCoord(e.y),
					_ = this._objectPoint,
					d = this._sqCellSize,
					c = null;
				for (t = l - 1; l + 1 >= t; t++)
					if (s = this._grid[t])
						for (i = u - 1; u + 1 >= i; i++)
							if (r = s[i])
								for (n = 0, o = r.length; o > n; n++) a = r[n], h = this._sqDist(_[L.Util.stamp(a)], e), d > h && (d = h, c = a);
				return c
			},
			_getCoord: function(e) {
				return Math.floor(e / this._cellSize)
			},
			_sqDist: function(e, t) {
				var i = t.x - e.x,
					n = t.y - e.y;
				return i * i + n * n
			}
		},
		function() {
			L.QuickHull = {
				getDistant: function(e, t) {
					var i = t[1].lat - t[0].lat,
						n = t[0].lng - t[1].lng;
					return n * (e.lat - t[0].lat) + i * (e.lng - t[0].lng)
				},
				findMostDistantPointFromBaseLine: function(e, t) {
					var i, n, s, r = 0,
						o = null,
						a = [];
					for (i = t.length - 1; i >= 0; i--) n = t[i], s = this.getDistant(n, e), s > 0 && (a.push(n), s > r && (r = s, o = n));
					return {
						maxPoint: o,
						newPoints: a
					}
				},
				buildConvexHull: function(e, t) {
					var i = [],
						n = this.findMostDistantPointFromBaseLine(e, t);
					return n.maxPoint ? (i = i.concat(this.buildConvexHull([e[0], n.maxPoint], n.newPoints)), i = i.concat(this.buildConvexHull([n.maxPoint, e[1]], n.newPoints))) : [e[0]]
				},
				getConvexHull: function(e) {
					var t, i = !1,
						n = !1,
						s = !1,
						r = !1,
						o = null,
						a = null,
						h = null,
						u = null,
						l = null,
						_ = null;
					for (t = e.length - 1; t >= 0; t--) {
						var d = e[t];
						(i === !1 || d.lat > i) && (o = d, i = d.lat), (n === !1 || d.lat < n) && (a = d, n = d.lat), (s === !1 || d.lng > s) && (h = d, s = d.lng), (r === !1 || d.lng < r) && (u = d, r = d.lng)
					}
					n !== i ? (_ = a, l = o) : (_ = u, l = h);
					var c = [].concat(this.buildConvexHull([_, l], e), this.buildConvexHull([l, _], e));
					return c
				}
			}
		}(), L.MarkerCluster.include({
			getConvexHull: function() {
				var e, t, i = this.getAllChildMarkers(),
					n = [];
				for (t = i.length - 1; t >= 0; t--) e = i[t].getLatLng(), n.push(e);
				return L.QuickHull.getConvexHull(n)
			}
		}), L.MarkerCluster.include({
			_2PI: 2 * Math.PI,
			_circleFootSeparation: 25,
			_circleStartAngle: Math.PI / 6,
			_spiralFootSeparation: 28,
			_spiralLengthStart: 11,
			_spiralLengthFactor: 5,
			_circleSpiralSwitchover: 9,
			spiderfy: function() {
				if (this._group._spiderfied !== this && !this._group._inZoomAnimation) {
					var e, t = this.getAllChildMarkers(),
						i = this._group,
						n = i._map,
						s = n.latLngToLayerPoint(this._latlng);
					this._group._unspiderfy(), this._group._spiderfied = this, t.length >= this._circleSpiralSwitchover ? e = this._generatePointsSpiral(t.length, s) : (s.y += 10, e = this._generatePointsCircle(t.length, s)), this._animationSpiderfy(t, e)
				}
			},
			unspiderfy: function(e) {
				this._group._inZoomAnimation || (this._animationUnspiderfy(e), this._group._spiderfied = null)
			},
			_generatePointsCircle: function(e, t) {
				var i, n, s = this._group.options.spiderfyDistanceMultiplier * this._circleFootSeparation * (2 + e),
					r = s / this._2PI,
					o = this._2PI / e,
					a = [];
				for (a.length = e, i = e - 1; i >= 0; i--) n = this._circleStartAngle + i * o, a[i] = new L.Point(t.x + r * Math.cos(n), t.y + r * Math.sin(n))._round();
				return a
			},
			_generatePointsSpiral: function(e, t) {
				var i, n = this._group.options.spiderfyDistanceMultiplier,
					s = n * this._spiralLengthStart,
					r = n * this._spiralFootSeparation,
					o = n * this._spiralLengthFactor * this._2PI,
					a = 0,
					h = [];
				for (h.length = e, i = e - 1; i >= 0; i--) a += r / s + 5e-4 * i, h[i] = new L.Point(t.x + s * Math.cos(a), t.y + s * Math.sin(a))._round(), s += o / a;
				return h
			},
			_noanimationUnspiderfy: function() {
				var e, t, i = this._group,
					n = i._map,
					s = i._featureGroup,
					r = this.getAllChildMarkers();
				for (i._ignoreMove = !0, this.setOpacity(1), t = r.length - 1; t >= 0; t--) e = r[t], s.removeLayer(e), e._preSpiderfyLatlng && (e.setLatLng(e._preSpiderfyLatlng), delete e._preSpiderfyLatlng), e.setZIndexOffset && e.setZIndexOffset(0), e._spiderLeg && (n.removeLayer(e._spiderLeg), delete e._spiderLeg);
				i.fire("unspiderfied", {
					cluster: this,
					markers: r
				}), i._ignoreMove = !1, i._spiderfied = null
			}
		}), L.MarkerClusterNonAnimated = L.MarkerCluster.extend({
			_animationSpiderfy: function(e, t) {
				var i, n, s, r, o = this._group,
					a = o._map,
					h = o._featureGroup,
					u = this._group.options.spiderLegPolylineOptions;
				for (o._ignoreMove = !0, i = 0; i < e.length; i++) r = a.layerPointToLatLng(t[i]), n = e[i], s = new L.Polyline([this._latlng, r], u), a.addLayer(s), n._spiderLeg = s, n._preSpiderfyLatlng = n._latlng, n.setLatLng(r), n.setZIndexOffset && n.setZIndexOffset(1e6), h.addLayer(n);
				this.setOpacity(.3), o._ignoreMove = !1, o.fire("spiderfied", {
					cluster: this,
					markers: e
				})
			},
			_animationUnspiderfy: function() {
				this._noanimationUnspiderfy()
			}
		}), L.MarkerCluster.include({
			_animationSpiderfy: function(e, t) {
				var n, s, r, o, a, h, u = this,
					l = this._group,
					_ = l._map,
					d = l._featureGroup,
					c = this._latlng,
					p = _.latLngToLayerPoint(c),
					f = L.Path.SVG,
					m = L.extend({}, this._group.options.spiderLegPolylineOptions),
					g = m.opacity;
				for (g === i && (g = L.MarkerClusterGroup.prototype.options.spiderLegPolylineOptions.opacity), f ? (m.opacity = 0, m.className = (m.className || "") + " leaflet-cluster-spider-leg") : m.opacity = g, l._ignoreMove = !0, n = 0; n < e.length; n++) s = e[n], h = _.layerPointToLatLng(t[n]), r = new L.Polyline([c, h], m), _.addLayer(r), s._spiderLeg = r, f && (o = r._path, a = o.getTotalLength() + .1, o.style.strokeDasharray = a, o.style.strokeDashoffset = a), s.setZIndexOffset && s.setZIndexOffset(1e6), s.clusterHide && s.clusterHide(), d.addLayer(s), s._setPos && s._setPos(p);
				for (l._forceLayout(), l._animationStart(), n = e.length - 1; n >= 0; n--) h = _.layerPointToLatLng(t[n]), s = e[n], s._preSpiderfyLatlng = s._latlng, s.setLatLng(h), s.clusterShow && s.clusterShow(), f && (r = s._spiderLeg, o = r._path, o.style.strokeDashoffset = 0, r.setStyle({
					opacity: g
				}));
				this.setOpacity(.3), l._ignoreMove = !1, setTimeout(function() {
					l._animationEnd(), l.fire("spiderfied", {
						cluster: u,
						markers: e
					})
				}, 200)
			},
			_animationUnspiderfy: function(e) {
				var t, i, n, s, r, o, a = this,
					h = this._group,
					u = h._map,
					l = h._featureGroup,
					_ = e ? u._latLngToNewLayerPoint(this._latlng, e.zoom, e.center) : u.latLngToLayerPoint(this._latlng),
					d = this.getAllChildMarkers(),
					c = L.Path.SVG;
				for (h._ignoreMove = !0, h._animationStart(), this.setOpacity(1), i = d.length - 1; i >= 0; i--) t = d[i], t._preSpiderfyLatlng && (t.setLatLng(t._preSpiderfyLatlng), delete t._preSpiderfyLatlng, o = !0, t._setPos && (t._setPos(_), o = !1), t.clusterHide && (t.clusterHide(), o = !1), o && l.removeLayer(t), c && (n = t._spiderLeg, s = n._path, r = s.getTotalLength() + .1, s.style.strokeDashoffset = r, n.setStyle({
					opacity: 0
				})));
				h._ignoreMove = !1, setTimeout(function() {
					var e = 0;
					for (i = d.length - 1; i >= 0; i--) t = d[i], t._spiderLeg && e++;
					for (i = d.length - 1; i >= 0; i--) t = d[i], t._spiderLeg && (t.clusterShow && t.clusterShow(), t.setZIndexOffset && t.setZIndexOffset(0), e > 1 && l.removeLayer(t), u.removeLayer(t._spiderLeg), delete t._spiderLeg);
					h._animationEnd(), h.fire("unspiderfied", {
						cluster: a,
						markers: d
					})
				}, 200)
			}
		}), L.MarkerClusterGroup.include({
			_spiderfied: null,
			unspiderfy: function() {
				this._unspiderfy.apply(this, arguments)
			},
			_spiderfierOnAdd: function() {
				this._map.on("click", this._unspiderfyWrapper, this), this._map.options.zoomAnimation && this._map.on("zoomstart", this._unspiderfyZoomStart, this), this._map.on("zoomend", this._noanimationUnspiderfy, this), L.Browser.touch || this._map.getRenderer(this)
			},
			_spiderfierOnRemove: function() {
				this._map.off("click", this._unspiderfyWrapper, this), this._map.off("zoomstart", this._unspiderfyZoomStart, this), this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._map.off("zoomend", this._noanimationUnspiderfy, this), this._noanimationUnspiderfy()
			},
			_unspiderfyZoomStart: function() {
				this._map && this._map.on("zoomanim", this._unspiderfyZoomAnim, this)
			},
			_unspiderfyZoomAnim: function(e) {
				L.DomUtil.hasClass(this._map._mapPane, "leaflet-touching") || (this._map.off("zoomanim", this._unspiderfyZoomAnim, this), this._unspiderfy(e))
			},
			_unspiderfyWrapper: function() {
				this._unspiderfy()
			},
			_unspiderfy: function(e) {
				this._spiderfied && this._spiderfied.unspiderfy(e)
			},
			_noanimationUnspiderfy: function() {
				this._spiderfied && this._spiderfied._noanimationUnspiderfy()
			},
			_unspiderfyLayer: function(e) {
				e._spiderLeg && (this._featureGroup.removeLayer(e), e.clusterShow && e.clusterShow(), e.setZIndexOffset && e.setZIndexOffset(0), this._map.removeLayer(e._spiderLeg), delete e._spiderLeg)
			}
		}), L.MarkerClusterGroup.include({
			refreshClusters: function(e) {
				return e ? e instanceof L.MarkerClusterGroup ? e = e._topClusterLevel.getAllChildMarkers() : e instanceof L.LayerGroup ? e = e._layers : e instanceof L.MarkerCluster ? e = e.getAllChildMarkers() : e instanceof L.Marker && (e = [e]) : e = this._topClusterLevel.getAllChildMarkers(), this._flagParentsIconsNeedUpdate(e), this._refreshClustersIcons(), this.options.singleMarkerMode && this._refreshSingleMarkerModeMarkers(e), this
			},
			_flagParentsIconsNeedUpdate: function(e) {
				var t, i;
				for (t in e)
					for (i = e[t].__parent; i;) i._iconNeedsUpdate = !0, i = i.__parent
			},
			_refreshClustersIcons: function() {
				this._featureGroup.eachLayer(function(e) {
					e instanceof L.MarkerCluster && e._iconNeedsUpdate && e._updateIcon()
				})
			},
			_refreshSingleMarkerModeMarkers: function(e) {
				var t, i;
				for (t in e) i = e[t], this.hasLayer(i) && i.setIcon(this._overrideMarkerIcon(i))
			}
		}), L.Marker.include({
			refreshIconOptions: function(e, t) {
				var i = this.options.icon;
				return L.setOptions(i, e), this.setIcon(i), t && this.__parent && this.__parent._group.refreshClusters(this), this
			}
		})
}(window, document);